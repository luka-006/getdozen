"use server";

import { resolveAppUrlFromHeaders } from "@/lib/app-url";
import { requestIp } from "@/lib/assert-human";
import { otpSendError, verifyEmailOtp } from "@/lib/auth-otp";
import { checkBotGuard } from "@/lib/bot-guard";
import { isLaunchOpen } from "@/lib/launch";
import { getReferralShare } from "@/lib/account-rewards";
import { inviteFriendsLine, referralShareUrl } from "@/lib/referral-copy";
import { referralBonusDots } from "@/lib/reward-config";
import { createClient } from "@/lib/supabase/server";
import {
  markWaitlistConfirmed,
  normalizeWaitlistEmail,
  removeWaitlistEmail,
  upsertWaitlistEmail,
} from "@/lib/waitlist";

export async function requestWaitlistCode(formData: FormData) {
  if (isLaunchOpen()) {
    return { ok: false as const, error: "Dozen is open. Use Join instead." };
  }

  const email = normalizeWaitlistEmail(formData.get("email"));
  if (!email) {
    return { ok: false as const, error: "Enter a valid email." };
  }

  const guard = await checkBotGuard(formData, await requestIp(), "waitlist");
  if (!guard.ok) {
    return { ok: false as const, error: guard.error };
  }

  let joined: Awaited<ReturnType<typeof upsertWaitlistEmail>>;
  try {
    joined = await upsertWaitlistEmail(email, formData.get("ref"));
  } catch {
    return { ok: false as const, error: "Could not join just now. Try again." };
  }

  const siteUrl = await resolveAppUrlFromHeaders();
  const shareUrl = joined.referral_code
    ? referralShareUrl(joined.referral_code, siteUrl)
    : null;
  const bonus = referralBonusDots();
  const referralLine = bonus == null ? null : inviteFriendsLine(bonus);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: joined.email,
    options: {
      shouldCreateUser: true,
      data: {
        waitlist: true,
        ...(joined.referral_code ? { referral_code: joined.referral_code } : {}),
        ...(shareUrl ? { referral_url: shareUrl } : {}),
        ...(referralLine ? { referral_line: referralLine } : {}),
      },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/waitlist/confirmed")}`,
    },
  });

  if (error) {
    return { ok: false as const, error: otpSendError(error.message).message };
  }

  return { ok: true as const, email: joined.email };
}

export async function confirmWaitlistCode(formData: FormData) {
  if (isLaunchOpen()) {
    return { ok: false as const, error: "Dozen is open. Use Join instead." };
  }

  const email = normalizeWaitlistEmail(formData.get("email"));
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");
  if (!email) {
    return { ok: false as const, error: "Enter a valid email." };
  }
  if (!/^\d{6}$/.test(token)) {
    return { ok: false as const, error: "Enter the 6-digit code from your email." };
  }

  const supabase = await createClient();
  const { error } = await verifyEmailOtp(supabase, email, token);

  if (error) {
    return { ok: false as const, error: "That code did not match. Try again." };
  }

  await markWaitlistConfirmed(email);
  const share = await getReferralShare({ email });
  await supabase.auth.signOut();
  return {
    ok: true as const,
    referralCode: share.code,
    shareUrl: share.shareUrl,
    pendingLine: share.pendingLine,
    inviteLine: share.inviteLine,
  };
}

export async function cancelWaitlistEnrollment(formData: FormData) {
  if (isLaunchOpen()) {
    return { ok: false as const, error: "Dozen is open. No waitlist to leave." };
  }

  const email = normalizeWaitlistEmail(formData.get("email"));
  if (!email) {
    return { ok: false as const, error: "Enter a valid email." };
  }

  const guard = await checkBotGuard(formData, await requestIp(), "waitlist");
  if (!guard.ok) {
    return { ok: false as const, error: guard.error };
  }

  try {
    const removed = await removeWaitlistEmail(email);
    if (!removed) {
      return {
        ok: false as const,
        error: "That email is not on the waitlist anymore.",
      };
    }
  } catch {
    return { ok: false as const, error: "Could not cancel just now. Try again." };
  }

  return { ok: true as const };
}
