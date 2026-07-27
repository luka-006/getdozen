import {
  AUTO_CONFIRM_HOURS,
  BOUNTY_MULTIPLIER,
  creditCostForQuestionCount,
  RAMP_RATE,
  RAMP_REVIEW_COUNT,
  SIGNUP_BONUS,
} from "@/lib/constants";
import { isLaunchBonusActive } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";

export { SIGNUP_BONUS };

export function earnAmountForReview(
  questionCount: number,
  profile: Pick<Profile, "reviews_given" | "is_ramped">,
  bountyMultiplier = 1,
): number {
  let amount = creditCostForQuestionCount(questionCount) * bountyMultiplier;
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

export function autoConfirmAt(from = new Date()): string {
  return new Date(from.getTime() + AUTO_CONFIRM_HOURS * 60 * 60 * 1000).toISOString();
}

export function withBounty(base: number, multiplier: number): number {
  return Number((base * (multiplier || 1)).toFixed(2));
}

export { BOUNTY_MULTIPLIER, creditCostForQuestionCount };
