"use server";

import { redirect } from "next/navigation";
import { resolveAppUrlFromHeaders } from "@/lib/app-url";
import { assertHuman, requestIp } from "@/lib/assert-human";
import { sendSignupConfirmEmail } from "@/lib/auth-mail";
import { verifyEmailOtp } from "@/lib/auth-otp";
import { avatarPresetById } from "@/lib/avatar-presets";
import { checkBotGuard } from "@/lib/bot-guard";
import { isLaunchOpen } from "@/lib/launch";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safe-path";

function loginCredentialError(message: string) {
  return /invalid login credentials/i.test(message)
    ? "Wrong email or password. If you joined with Google, use Continue with Google, or Forgot to set a password."
    : message;
}

export async function signInWithEmailPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeInternalPath(formData.get("next"), "/board");
  const guard = await checkBotGuard(formData, await requestIp(), "login");
  if (!guard.ok) {
    return { ok: false as const, error: guard.error, waitSeconds: null as number | null };
  }
  if (!email || password.length < 8) {
    return {
      ok: false as const,
      error: "Enter your email and password.",
      waitSeconds: null as number | null,
    };
  }

  const supabase = await createClient();
  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (passwordError) {
    return {
      ok: false as const,
      error: loginCredentialError(passwordError.message),
      waitSeconds: null as number | null,
    };
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
  const guard = await checkBotGuard(formData, await requestIp(), "signup");
  if (!guard.ok) {
    return { ok: false as const, error: guard.error };
  }

  const requiredCodes = (process.env.INVITE_CODES ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  if (requiredCodes.length > 0 && !requiredCodes.includes(invite)) {
    redirect(
      `/signup?error=${encodeURIComponent("Invite code required")}&next=${encodeURIComponent(next)}`,
    );
  }

  if (!email || password.length < 8) {
    redirect(
      `/signup?error=${encodeURIComponent("Enter a valid email and a password of at least 8 characters")}`,
    );
  }

  const siteUrl = await resolveAppUrlFromHeaders();
  const admin = createAdminClient();
  const fullName = displayName || email.split("@")[0] || "Maker";

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

  if (linkError) {
    const raw = linkError.message;
    if (/already|registered|exists/i.test(raw)) {
      redirect(
        `/login?error=${encodeURIComponent("This email already has an account. Sign in, or use Forgot to set a password.")}`,
      );
    }
    redirect(`/signup?error=${encodeURIComponent(raw)}`);
  }

  const hashedToken = linkData.properties?.hashed_token;
  if (!hashedToken) {
    redirect(
      `/signup?error=${encodeURIComponent("Could not create confirmation link. Try again.")}`,
    );
  }

  const confirmUrl = new URL(`${siteUrl}/auth/callback`);
  confirmUrl.searchParams.set("token_hash", hashedToken);
  confirmUrl.searchParams.set("type", "signup");
  confirmUrl.searchParams.set("next", next);

  const mailed = await sendSignupConfirmEmail({
    to: email,
    confirmUrl: confirmUrl.toString(),
    displayName: fullName,
  });
  if (!mailed.ok) {
    redirect(
      `/signup?error=${encodeURIComponent(mailed.error || "Could not send confirmation email")}`,
    );
  }

  return {
    ok: true as const,
    message: "Check your email for the confirmation link.",
  };
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
    redirect(`/login/forgot?error=${encodeURIComponent(error.message)}`);
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
      `/profile/${user.id}?error=${encodeURIComponent("Name must be 2 to 40 characters")}`,
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

export async function updateProfileAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const presetId = String(formData.get("avatar_preset") ?? "").trim();
  const preset = avatarPresetById(presetId);
  if (!preset) {
    redirect(
      `/profile/${user.id}?error=${encodeURIComponent("Pick one of the avatars shown")}`,
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: preset.url })
    .eq("id", user.id);

  if (error) {
    redirect(
      `/profile/${user.id}?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect(`/profile/${user.id}?message=${encodeURIComponent("Avatar updated")}`);
}
