"use server";

import { redirect } from "next/navigation";
import { resolveAppUrlFromHeaders } from "@/lib/app-url";
import { assertHuman, requestIp } from "@/lib/assert-human";
import { otpSendError, verifyEmailOtp } from "@/lib/auth-otp";
import { checkBotGuard } from "@/lib/bot-guard";
import { isLaunchOpen } from "@/lib/launch";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safe-path";

function loginCredentialError(message: string) {
  return /invalid login credentials/i.test(message)
    ? "Wrong email or password. If you joined with Google, use Continue with Google — or Forgot to set a password."
    : message;
}

export async function requestLoginCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const guard = await checkBotGuard(formData, await requestIp(), "login");
  if (!guard.ok) {
    return { ok: false as const, error: guard.error };
  }
  if (!email || password.length < 8) {
    return { ok: false as const, error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (passwordError) {
    return { ok: false as const, error: loginCredentialError(passwordError.message) };
  }

  await supabase.auth.signOut();

  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (otpError) {
    return { ok: false as const, error: otpSendError(otpError.message) };
  }

  return { ok: true as const, email };
}

export async function resendLoginCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const guard = await checkBotGuard(formData, await requestIp(), "login");
  if (!guard.ok) {
    return { ok: false as const, error: guard.error };
  }
  if (!email) {
    return { ok: false as const, error: "Enter a valid email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) {
    return { ok: false as const, error: otpSendError(error.message) };
  }

  return { ok: true as const, email };
}

export async function confirmLoginCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");
  const next = safeInternalPath(formData.get("next"), "/board");
  const guard = await checkBotGuard(formData, await requestIp(), "login");
  if (!guard.ok) {
    return { ok: false as const, error: guard.error };
  }
  if (!email) {
    return { ok: false as const, error: "Enter a valid email." };
  }
  if (!/^\d{6}$/.test(token)) {
    return {
      ok: false as const,
      error: "Enter the 6-digit code from your email.",
    };
  }

  const supabase = await createClient();
  const { error } = await verifyEmailOtp(supabase, email, token);
  if (error) {
    return { ok: false as const, error: "That code did not match. Try again." };
  }

  redirect(next);
}

export async function signUpWithEmail(formData: FormData) {
  if (!isLaunchOpen()) {
    redirect("/");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const invite = String(formData.get("invite_code") ?? "").trim();
  const next = safeInternalPath(formData.get("next"), "/board");
  await assertHuman(formData, "/signup", { next }, "signup");

  const requiredCodes = (process.env.INVITE_CODES ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  if (requiredCodes.length > 0 && !requiredCodes.includes(invite)) {
    redirect(
      `/signup?error=${encodeURIComponent("Invite code required")}&next=${encodeURIComponent(next)}`,
    );
  }

  const siteUrl = await resolveAppUrlFromHeaders();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayName || email.split("@")[0],
      },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  const identityCount = data.user?.identities?.length ?? null;

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Existing confirmed users (e.g. Google-only) return 200 with empty identities
  // and no confirmation email.
  if (data.user && identityCount === 0) {
    redirect(
      `/login?error=${encodeURIComponent("This email already has an account. Sign in with Google, or use Forgot to set a password.")}`,
    );
  }

  redirect("/login?message=Check your email to confirm your account");
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeInternalPath(formData.get("next"), "/board");
  const siteUrl = await resolveAppUrlFromHeaders();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    const raw = error?.message ?? "Google sign-in failed";
    const hint =
      /provider is not enabled|unsupported provider/i.test(raw)
        ? "Google login is not enabled yet. In Supabase: Authentication → Providers → Google (add Client ID + Secret)."
        : raw;
    redirect(`/login?error=${encodeURIComponent(hint)}`);
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  await assertHuman(formData, "/login/forgot", {}, "reset");
  const email = String(formData.get("email") ?? "").trim();
  const siteUrl = await resolveAppUrlFromHeaders();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/login?message=Password+reset+sent.+Check+email.+Then+sign+in.")}`,
  });
  if (error) {
    redirect(
      `/login/forgot?error=${encodeURIComponent(error.message)}`,
    );
  }
  redirect(
    `/login?message=${encodeURIComponent("Check your email for a reset link")}`,
  );
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  if (displayName.length < 2 || displayName.length > 40) {
    redirect(
      `/profile/${user.id}?error=${encodeURIComponent("Name must be 2–40 characters")}`,
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    redirect(
      `/profile/${user.id}?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect(`/profile/${user.id}?message=${encodeURIComponent("Saved")}`);
}
