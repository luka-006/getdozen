import {
  AUTO_CONFIRM_HOURS,
  BOUNTY_MULTIPLIER,
  creditCostForQuestionCount,
  FIRST_REVIEW_GIFT,
  RAMP_RATE,
  RAMP_REVIEW_COUNT,
  reviewEarnForQuestionCount,
  SIGNUP_BONUS,
} from "@/lib/constants";
import { isLaunchBonusActive } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { currencyName, currencyUnits } from "@/lib/currency";
import { createAdminClient } from "@/lib/supabase/admin";

export { SIGNUP_BONUS };

/**
 * Give one confirmed review first, then buy any amount.
 */
export function canPurchaseDots(
  profile: Pick<Profile, "purchased_credits" | "reviews_given">,
  amount: number,
): { ok: true } | { ok: false; error: string } {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: `Choose a valid ${currencyUnits(2)} amount.` };
  }

  if (Number(profile.reviews_given ?? 0) < 1) {
    return {
      ok: false,
      error: `Complete one confirmed review before buying ${currencyName().toLowerCase()}.`,
    };
  }

  return { ok: true };
}

/** @deprecated use canPurchaseDots */
export const canPurchaseCredits = canPurchaseDots;

export function earnAmountForReview(
  questionCount: number,
  profile: Pick<Profile, "reviews_given" | "is_ramped">,
  bountyMultiplier = 1,
): number {
  let amount = reviewEarnForQuestionCount(questionCount) * bountyMultiplier;
  if (!profile.is_ramped && profile.reviews_given < RAMP_REVIEW_COUNT) {
    amount *= RAMP_RATE;
  }
  if (isLaunchBonusActive()) {
    amount *= 2;
  }
  return Number(amount.toFixed(2));
}

export async function appendLedger(params: {
  userId: string;
  amount: number;
  reason: string;
  refId?: string | null;
  status?: "pending" | "available" | "expired" | "voided";
  availableAt?: string | null;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("ledger_insert", {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_reason: params.reason,
    p_ref_id: params.refId ?? null,
    p_status: params.status ?? "available",
    p_expires_at: null,
    p_available_at: params.availableAt ?? null,
  });

  if (error) throw new Error(error.message);
  return data as string;
}

export async function spendCredits(params: {
  userId: string;
  amount: number;
  reason: string;
  refId?: string | null;
}) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("spend_credits", {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_reason: params.reason,
    p_ref_id: params.refId ?? null,
  });
  if (error) throw new Error(error.message);
}

/** One-time +1 credit when a reviewer's first review is confirmed. */
export async function maybeGiftFirstReview(userId: string, reviewId: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("credit_ledger")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", "first_review_gift")
    .maybeSingle();
  if (existing) return false;

  await appendLedger({
    userId,
    amount: FIRST_REVIEW_GIFT,
    reason: "first_review_gift",
    refId: reviewId,
    status: "available",
  });
  return true;
}

export function autoConfirmAt(from = new Date()): string {
  return new Date(from.getTime() + AUTO_CONFIRM_HOURS * 60 * 60 * 1000).toISOString();
}

export function withBounty(base: number, multiplier: number): number {
  return Number((base * (multiplier || 1)).toFixed(2));
}

export {
  BOUNTY_MULTIPLIER,
  creditCostForQuestionCount,
  reviewEarnForQuestionCount,
};
