import type { SupabaseClient } from "@supabase/supabase-js";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/product-image";
import {
  deleteStoredProductImages,
  type ProductImageRetentionRow,
} from "@/lib/product-image-storage";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Retention policy (Vercel free tier — keep storage and row count lean):
 *
 * KEEP (never deleted by this job):
 * - Profiles, auth, credit ledger / payment history (separate tables; no FK cascade)
 * - Reviews, peer profile_reviews, thanks_messages (block hard-delete when linked)
 * - open / in_progress requests
 * - Demo posts (is_demo = true)
 * - Terminal posts within the grace window (see RETENTION_DAYS)
 * - Rows with product_image_path IS NULL (legacy Dicebear / external app_icon_url only)
 * - Terminal posts past grace that still have reviews, tester commitments, or bug reports
 *   (storage removed and image columns nulled; row kept for reputation / audit context)
 *
 * DELETE after grace (product_image_path IS NOT NULL only):
 * - Supabase product-logos objects via deleteStoredProductImages
 * - product_image_path, product_image_url, test_credentials_encrypted on processed rows
 * - Hard-delete terminal rows with stored logos when no reviews, commitments, or bugs remain
 * - Orphaned product-logos objects with no DB reference (batched)
 */

/** Days after expires_at before terminal posts are eligible for cleanup. */
export const RETENTION_DAYS = 90;

/** Max terminal requests processed per cron run (avoid Vercel timeout). */
export const REQUEST_BATCH_SIZE = 50;

/** Max orphan storage objects scanned per run. */
export const ORPHAN_STORAGE_BATCH_SIZE = 100;

const TERMINAL_STATUSES = ["completed", "expired", "cancelled"] as const;

export type RetentionCleanupResult = {
  requestsProcessed: number;
  imagesRemoved: number;
  requestsHardDeleted: number;
  requestsStripped: number;
  orphansRemoved: number;
  skippedDemo: number;
  skippedLegacyIcon: number;
  errors: number;
};

type RequestRow = ProductImageRetentionRow & {
  test_credentials_encrypted: string | null;
  is_demo: boolean | null;
};

function retentionCutoffIso(now = new Date()): string {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS);
  return cutoff.toISOString();
}

async function requestHasRetentionBlockers(
  admin: SupabaseClient,
  requestId: string,
): Promise<boolean> {
  const [reviews, commitments, bugs] = await Promise.all([
    admin
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("request_id", requestId),
    admin
      .from("tester_commitments")
      .select("id", { count: "exact", head: true })
      .eq("request_id", requestId),
    admin
      .from("bug_reports")
      .select("id", { count: "exact", head: true })
      .eq("request_id", requestId),
  ]);

  return (
    (reviews.count ?? 0) > 0 ||
    (commitments.count ?? 0) > 0 ||
    (bugs.count ?? 0) > 0
  );
}

async function stripStoredProductImage(
  admin: SupabaseClient,
  row: RequestRow,
): Promise<{ imageRemoved: boolean; stripped: boolean }> {
  const path = row.product_image_path?.trim();
  if (!path) {
    return { imageRemoved: false, stripped: false };
  }

  const { error: deleteError } = await deleteStoredProductImages(admin, [path]);
  const imageRemoved = !deleteError;

  const needsStrip =
    Boolean(row.product_image_path) ||
    Boolean(row.product_image_url) ||
    Boolean(row.test_credentials_encrypted);

  if (!needsStrip) {
    return { imageRemoved, stripped: false };
  }

  const { error } = await admin
    .from("requests")
    .update({
      product_image_path: null,
      product_image_url: null,
      test_credentials_encrypted: null,
    })
    .eq("id", row.id);

  if (error) throw new Error(error.message);
  return { imageRemoved, stripped: true };
}

async function cleanupTerminalRequests(
  admin: SupabaseClient,
  cutoffIso: string,
): Promise<
  Pick<
    RetentionCleanupResult,
    | "requestsProcessed"
    | "imagesRemoved"
    | "requestsHardDeleted"
    | "requestsStripped"
    | "skippedDemo"
    | "errors"
  >
> {
  const result = {
    requestsProcessed: 0,
    imagesRemoved: 0,
    requestsHardDeleted: 0,
    requestsStripped: 0,
    skippedDemo: 0,
    errors: 0,
  };

  const { data: rows, error } = await admin
    .from("requests")
    .select(
      "id, product_image_path, product_image_url, test_credentials_encrypted, expires_at, is_demo, status",
    )
    .in("status", [...TERMINAL_STATUSES])
    .lt("expires_at", cutoffIso)
    .not("product_image_path", "is", null)
    .eq("is_demo", false)
    .order("expires_at", { ascending: true })
    .limit(REQUEST_BATCH_SIZE);

  if (error) throw new Error(error.message);

  for (const row of rows ?? []) {
    if (row.is_demo) {
      result.skippedDemo++;
      continue;
    }

    if (!row.product_image_path?.trim()) {
      continue;
    }

    result.requestsProcessed++;

    try {
      const { imageRemoved, stripped } = await stripStoredProductImage(admin, row);
      if (imageRemoved) result.imagesRemoved++;
      if (stripped) result.requestsStripped++;

      const blocked = await requestHasRetentionBlockers(admin, row.id);
      if (blocked) continue;

      const { error: deleteError } = await admin
        .from("requests")
        .delete()
        .eq("id", row.id);

      if (deleteError) throw new Error(deleteError.message);
      result.requestsHardDeleted++;
    } catch {
      result.errors++;
    }
  }

  return result;
}

async function cleanupOrphanProductImages(
  admin: SupabaseClient,
): Promise<{ orphansRemoved: number; errors: number }> {
  const result = { orphansRemoved: 0, errors: 0 };

  const { data: referencedRows, error: refListError } = await admin
    .from("requests")
    .select("product_image_path")
    .not("product_image_path", "is", null);

  if (refListError) throw new Error(refListError.message);

  const referencedPaths = new Set(
    (referencedRows ?? [])
      .map((row) => row.product_image_path?.trim())
      .filter((path): path is string => Boolean(path)),
  );

  const { data: folders, error: listError } = await admin.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .list("", { limit: 25, sortBy: { column: "name", order: "asc" } });

  if (listError) {
    if (listError.message.toLowerCase().includes("not found")) {
      return result;
    }
    throw new Error(listError.message);
  }

  let scanned = 0;

  for (const folder of folders ?? []) {
    if (!folder.name || scanned >= ORPHAN_STORAGE_BATCH_SIZE) break;

    const { data: files, error: nestedError } = await admin.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .list(folder.name, {
        limit: ORPHAN_STORAGE_BATCH_SIZE,
        sortBy: { column: "created_at", order: "asc" },
      });

    if (nestedError) {
      result.errors++;
      continue;
    }

    for (const file of files ?? []) {
      if (!file.name || scanned >= ORPHAN_STORAGE_BATCH_SIZE) break;
      scanned++;

      const path = `${folder.name}/${file.name}`;
      if (referencedPaths.has(path)) continue;

      const { error: deleteError } = await deleteStoredProductImages(admin, [path]);
      if (deleteError) {
        result.errors++;
      } else {
        result.orphansRemoved++;
      }
    }
  }

  return result;
}

export async function runRetentionCleanup(
  admin: SupabaseClient = createAdminClient(),
): Promise<RetentionCleanupResult> {
  const cutoffIso = retentionCutoffIso();
  const terminal = await cleanupTerminalRequests(admin, cutoffIso);
  const orphans = await cleanupOrphanProductImages(admin);

  return {
    ...terminal,
    orphansRemoved: orphans.orphansRemoved,
    skippedLegacyIcon: 0,
    errors: terminal.errors + orphans.errors,
  };
}
