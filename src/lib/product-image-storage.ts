import type { SupabaseClient } from "@supabase/supabase-js";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/product-image";

/** Row fields the retention cleanup cron reads before deleting storage objects. */
export type ProductImageRetentionRow = {
  id: string;
  product_image_path: string | null;
  product_image_url: string | null;
  status: string;
  expires_at: string;
};

export function productImagePublicUrl(
  supabase: SupabaseClient,
  path: string,
): string {
  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Parse storage path from a Supabase public object URL (fallback when path column is missing). */
export function productImagePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const raw = url.slice(i + marker.length).split("?")[0];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** True when the URL points at our product-logos bucket (safe to delete via storage API). */
export function isStoredProductImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return productImagePathFromPublicUrl(url) !== null;
}

export function resolveProductImagePath(row: {
  product_image_path?: string | null;
  product_image_url?: string | null;
}): string | null {
  const path = row.product_image_path?.trim();
  if (path) return path;
  const url = row.product_image_url?.trim();
  if (!url) return null;
  return productImagePathFromPublicUrl(url);
}

/** Delete one or more objects from the product-logos bucket (service role). */
export async function deleteStoredProductImages(
  supabase: SupabaseClient,
  paths: string[],
): Promise<{ deleted: string[]; error: string | null }> {
  const unique = [...new Set(paths.map((p) => p.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return { deleted: [], error: null };
  }

  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .remove(unique);

  if (error) {
    return { deleted: [], error: error.message };
  }

  return {
    deleted: (data ?? []).map((item) => item.name),
    error: null,
  };
}
