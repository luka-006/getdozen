"use server";

import { resolveAppUrlFromHeaders } from "@/lib/app-url";
import { otpSendError, verifyEmailOtp } from "@/lib/auth-otp";
import { isLaunchOpen } from "@/lib/launch";
import { createClient } from "@/lib/supabase/server";
import {
  markWaitlistConfirmed,
  normalizeWaitlistEmail,
  upsertWaitlistEmail,
} from "@/lib/waitlist";

export async function requestWaitlistCode(formData: FormData) {
  if (isLaunchOpen()) {
    return { ok: false as const, error: "Dozen is open — use Join instead." };
  }

  const email = normalizeWaitlistEmail(formData.get("email"));
  if (!email) {
    return { ok: false as const, error: "Enter a valid email." };
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
    return { ok: false as const, error: otpSendError(error.message) };
  }

  return { ok: true as const, email };
}

export async function confirmWaitlistCode(formData: FormData) {
  if (isLaunchOpen()) {
    return { ok: false as const, error: "Dozen is open — use Join instead." };
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
  await supabase.auth.signOut();
  return { ok: true as const };
}
