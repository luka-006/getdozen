import { normalizeEmailIdentity } from "@/lib/email-identity";
import { isLaunchOpen } from "@/lib/launch";
import { pendingFriendsLine, referralShareUrl, inviteFriendsLine } from "@/lib/referral-copy";
import { referralBonusDots, referralMax, waitlistBonusDots } from "@/lib/reward-config";
import { createAdminClient } from "@/lib/supabase/admin";

export type AccountUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

export type RewardDeps = {
  ensureProfile: (user: AccountUser) => Promise<void>;
  settle: (userId: string) => Promise<unknown>;
  launchOpen: () => boolean;
};

type GrantResult = {
  ok: boolean;
  reason?: string;
  waitlist_granted: boolean;
  referral_paid: number;
  skipped?: string;
};

function metaString(user: AccountUser, key: string): string | null {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function displayNameFor(user: AccountUser): string {
  const name =
    metaString(user, "full_name") ||
    metaString(user, "name") ||
    user.email?.split("@")[0] ||
    "Maker";
  return String(name).slice(0, 40);
}

export async function ensureProfile(user: AccountUser): Promise<void> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return;

  const { error } = await admin.from("profiles").insert({
    id: user.id,
    email: user.email ?? "",
    display_name: displayNameFor(user),
    avatar_url: metaString(user, "avatar_url"),
  });
  if (error && !/duplicate|unique/i.test(error.message)) {
    throw new Error(error.message);
  }
}

export async function settleLaunchRewards(userId: string): Promise<GrantResult> {
  if (!isLaunchOpen()) {
    return {
      ok: true,
      waitlist_granted: false,
      referral_paid: 0,
      skipped: "launch_closed",
    };
  }

  const waitlistBonus = waitlistBonusDots();
  const referralBonus = referralBonusDots();
  const max = referralMax();
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("grant_launch_rewards", {
    p_user_id: userId,
    p_waitlist_bonus: waitlistBonus ?? 0,
    p_referral_bonus: referralBonus ?? 0,
    p_referral_max: max ?? 0,
  });
  if (error) throw new Error(error.message);
  const row = (data ?? {}) as Partial<GrantResult>;
  return {
    ok: row.ok !== false,
    reason: row.reason,
    waitlist_granted: Boolean(row.waitlist_granted),
    referral_paid: Number(row.referral_paid ?? 0),
  };
}

/** Profile first, then the one-shot grant. Launch-closed sessions do not grant. */
export async function runAccountBootstrap(
  user: AccountUser,
  deps: RewardDeps,
): Promise<void> {
  await deps.ensureProfile(user);
  if (!deps.launchOpen()) return;
  await deps.settle(user.id);
}

export async function bootstrapAccountRewards(user: AccountUser): Promise<void> {
  await runAccountBootstrap(user, {
    ensureProfile,
    settle: settleLaunchRewards,
    launchOpen: isLaunchOpen,
  });
}

export type ReferralShare = {
  code: string | null;
  shareUrl: string | null;
  pendingCount: number;
  pendingLine: string | null;
  inviteLine: string | null;
};

const emptyShare: ReferralShare = {
  code: null,
  shareUrl: null,
  pendingCount: 0,
  pendingLine: null,
  inviteLine: null,
};

export async function getReferralShare(input: {
  userId?: string | null;
  email?: string | null;
}): Promise<ReferralShare> {
  const bonus = referralBonusDots();
  const inviteLine = bonus == null ? null : inviteFriendsLine(bonus);
  try {
    const admin = createAdminClient();
    let code: string | null = null;
    let waitlistId: string | null = null;

    if (input.userId) {
      const { data } = await admin
        .from("profiles")
        .select("referral_code")
        .eq("id", input.userId)
        .maybeSingle();
      code = (data?.referral_code as string | null) ?? null;
    }

    if (input.email) {
      const { data } = await admin
        .from("waitlist")
        .select("id, referral_code")
        .eq("email_normalized", normalizeEmailIdentity(input.email))
        .maybeSingle();
      if (data) {
        waitlistId = data.id as string;
        code = code ?? (data.referral_code as string | null);
      }
    }

    const { data: pending, error } = await admin.rpc("pending_referral_count", {
      p_user_id: input.userId ?? null,
      p_waitlist_id: waitlistId,
    });
    if (error) throw new Error(error.message);
    const pendingCount = Number(pending ?? 0);
    return {
      code,
      shareUrl: code ? referralShareUrl(code) : null,
      pendingCount,
      pendingLine:
        !isLaunchOpen() && pendingCount > 0
          ? pendingFriendsLine(pendingCount)
          : null,
      inviteLine,
    };
  } catch (err) {
    console.error("referral share", err);
    return { ...emptyShare, inviteLine };
  }
}
