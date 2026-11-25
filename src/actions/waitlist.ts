"use server";

import { cookies } from "next/headers";
import { resolveAppUrlFromHeaders } from "@/lib/app-url";
import { requestIp } from "@/lib/assert-human";
import { otpSendError, verifyEmailOtp } from "@/lib/auth-otp";
import { checkBotGuard } from "@/lib/bot-guard";
import {
  EARLY_ACCESS_COOKIE,
  applyEarlyAccess,
  earlyAccessCookieOptions,
  earlyAccessSecret,
  signEarlyAccessToken,
} from "@/lib/early-access";
import { flagWaitlistEarlyAccess } from "@/lib/early-access-store";
import { isLaunchOpen } from "@/lib/launch";
import { createClient } from "@/lib/supabase/server";
import {
  markWaitlistConfirmed,
  normalizeWaitlistEmail,
  removeWaitlistById,
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

  try {
    await upsertWaitlistEmail(email);
  } catch {
    return { ok: false as const, error: "Could not join just now. Try again." };
  }

  const siteUrl = await resolveAppUrlFromHeaders();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { waitlist: true },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/waitlist/confirmed")}`,
    },
  });

  if (error) {
    return { ok: false as const, error: otpSendError(error.message).message };
  }

  return { ok: true as const, email };
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

  const rowId = await markWaitlistConfirmed(email);
  await rememberEarlyAccessRow(rowId);
  await supabase.auth.signOut();
  return { ok: true as const };
}

export async function rememberEarlyAccessRow(rowId: string | null) {
  const secret = earlyAccessSecret();
  if (!rowId || !secret) return;
  const token = await signEarlyAccessToken(secret, rowId);
  const jar = await cookies();
  jar.set(
    EARLY_ACCESS_COOKIE,
    token,
    earlyAccessCookieOptions(process.env.NODE_ENV === "production"),
  );
}

export async function requestWaitlistEarlyAccess() {
  if (isLaunchOpen()) {
    return { ok: false as const, error: "Dozen is open." };
  }
  const jar = await cookies();
  const token = jar.get(EARLY_ACCESS_COOKIE)?.value ?? null;
  try {
    return await applyEarlyAccess({
      token,
      secret: earlyAccessSecret(),
      nowMs: Date.now(),
      ip: (await requestIp()) ?? "",
      store: { flag: flagWaitlistEarlyAccess },
    });
  } catch {
    return { ok: false as const, error: "Could not save that just now. Try again." };
  }
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
