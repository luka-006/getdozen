"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminConsolePath,
  clearAdminSession,
  consoleConfigured,
  readLockState,
  recordTotpFailure,
  requireAdminConsoleSession,
  requireAdminOwner,
  setAdminSession,
  verifyTotpCode,
} from "@/lib/admin-console";
import { appendLedger } from "@/lib/credits";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardBugReport } from "@/actions/bug-report";

function gateRedirect(error?: string) {
  const base = `${adminConsolePath()}/gate`;
  if (!error) redirect(base);
  redirect(`${base}?error=${encodeURIComponent(error)}`);
}

export async function verifyAdminGate(formData: FormData) {
  const profile = await requireAdminOwner();

  if (!consoleConfigured()) {
    gateRedirect("Console is not configured on this server.");
  }

  const lock = await readLockState();
  if (lock.until > Date.now()) {
    const mins = Math.ceil((lock.until - Date.now()) / 60_000);
    gateRedirect(`Too many attempts. Wait ${mins} minutes.`);
  }

  const code = String(formData.get("code") ?? "").trim();
  if (!verifyTotpCode(code)) {
    await recordTotpFailure();
    gateRedirect("Invalid authenticator code.");
  }

  await setAdminSession(profile.id);
  redirect(adminConsolePath());
}

export async function signOutAdminConsole() {
  await requireAdminOwner();
  await clearAdminSession();
  redirect(`${adminConsolePath()}/gate`);
}

export async function adminRefundCredits(formData: FormData) {
  await requireAdminConsoleSession();

  const userId = String(formData.get("user_id") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 200);

  if (!userId || !Number.isFinite(amount) || amount <= 0 || amount > 500) {
    redirect(
      `${adminConsolePath()}?error=${encodeURIComponent("Invalid refund")}`,
    );
  }

  const admin = createAdminClient();
  const { data: user } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!user) {
    redirect(
      `${adminConsolePath()}?error=${encodeURIComponent("User not found")}`,
    );
  }

  await appendLedger({
    userId,
    amount,
    reason: note ? `admin_refund:${note}` : "admin_refund",
    status: "available",
  });

  revalidatePath(adminConsolePath());
  redirect(
    `${adminConsolePath()}?message=${encodeURIComponent(`Refunded ${amount} credits`)}`,
  );
}

export async function adminAdjustCredits(formData: FormData) {
  await requireAdminConsoleSession();

  const userId = String(formData.get("user_id") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 200);

  if (!userId || !Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 500) {
    redirect(
      `${adminConsolePath()}?error=${encodeURIComponent("Invalid adjustment")}`,
    );
  }

  const admin = createAdminClient();
  const { data: user } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!user) {
    redirect(
      `${adminConsolePath()}?error=${encodeURIComponent("User not found")}`,
    );
  }

  if (amount < 0) {
    const { error } = await admin.rpc("spend_credits", {
      p_user_id: userId,
      p_amount: Math.abs(amount),
      p_reason: note ? `admin_debit:${note}` : "admin_debit",
      p_ref_id: null,
    });
    if (error) {
      redirect(
        `${adminConsolePath()}?error=${encodeURIComponent(error.message)}`,
      );
    }
  } else {
    await appendLedger({
      userId,
      amount,
      reason: note ? `admin_credit:${note}` : "admin_credit",
      status: "available",
    });
  }

  revalidatePath(adminConsolePath());
  redirect(
    `${adminConsolePath()}?message=${encodeURIComponent(`Adjusted ${amount} credits`)}`,
  );
}

export async function adminConfirmReview(formData: FormData) {
  await requireAdminConsoleSession();

  const reviewId = String(formData.get("review_id") ?? "").trim();
  if (!reviewId) {
    redirect(
      `${adminConsolePath()}?error=${encodeURIComponent("Missing review")}`,
    );
  }

  const admin = createAdminClient();
  const { data: review } = await admin
    .from("reviews")
    .select("id, confirm_status, reviewer_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (!review || review.confirm_status !== "pending") {
    redirect(
      `${adminConsolePath()}?error=${encodeURIComponent("Review not pending")}`,
    );
  }

  await admin
    .from("reviews")
    .update({ confirm_status: "confirmed" })
    .eq("id", reviewId);

  await admin.rpc("release_pending_credits", { p_review_id: reviewId });

  const { data: reviewer } = await admin
    .from("profiles")
    .select("reviews_given")
    .eq("id", review.reviewer_id)
    .maybeSingle();

  if (reviewer) {
    await admin
      .from("profiles")
      .update({
        reviews_given: Number(reviewer.reviews_given ?? 0) + 1,
        has_reviewed_once: true,
        is_ramped: Number(reviewer.reviews_given ?? 0) + 1 >= 5,
      })
      .eq("id", review.reviewer_id);
  }

  revalidatePath(adminConsolePath());
  redirect(
    `${adminConsolePath()}?message=${encodeURIComponent("Review confirmed")}`,
  );
}

export async function adminRejectReview(formData: FormData) {
  await requireAdminConsoleSession();

  const reviewId = String(formData.get("review_id") ?? "").trim();
  if (!reviewId) {
    redirect(
      `${adminConsolePath()}?error=${encodeURIComponent("Missing review")}`,
    );
  }

  const admin = createAdminClient();
  const { data: review } = await admin
    .from("reviews")
    .select("id, confirm_status, reviewer_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (!review || review.confirm_status !== "pending") {
    redirect(
      `${adminConsolePath()}?error=${encodeURIComponent("Review not pending")}`,
    );
  }

  await admin
    .from("reviews")
    .update({ confirm_status: "rejected" })
    .eq("id", reviewId);

  await admin
    .from("credit_ledger")
    .update({ status: "voided" })
    .eq("ref_id", reviewId)
    .eq("status", "pending");

  await admin.rpc("recompute_balances", { p_user_id: review.reviewer_id });

  revalidatePath(adminConsolePath());
  redirect(
    `${adminConsolePath()}?message=${encodeURIComponent("Review rejected")}`,
  );
}

export async function adminBanUser(formData: FormData) {
  await requireAdminConsoleSession();

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) {
    redirect(
      `${adminConsolePath()}?error=${encodeURIComponent("Missing user")}`,
    );
  }

  const admin = createAdminClient();
  await admin.from("profiles").update({ is_banned: true }).eq("id", userId);

  revalidatePath(adminConsolePath());
  redirect(
    `${adminConsolePath()}?message=${encodeURIComponent("User banned")}`,
  );
}

export { awardBugReport } from "@/actions/bug-report";
