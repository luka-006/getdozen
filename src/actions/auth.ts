"use server";

import { redirect } from "next/navigation";
import { resolveAppUrlFromHeaders } from "@/lib/app-url";
import { assertHuman, requestIp } from "@/lib/assert-human";
import { sendSignupConfirmEmail } from "@/lib/auth-mail";
import { otpSendError, verifyEmailOtp } from "@/lib/auth-otp";
import { avatarPresetById } from "@/lib/avatar-presets";
import { checkBotGuard } from "@/lib/bot-guard";
import { isLaunchOpen } from "@/lib/launch";
import { isPasswordOnlyTestLogin } from "@/lib/test-login";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safe-path";

function loginCredentialError(message: string) {
  return /invalid login credentials/i.test(message)
    ? "Wrong email or password. If you joined with Google, use Continue with Google, or Forgot to set a password."
    : message;
}

export async function requestLoginCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
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

  // Test accounts with no real inbox skip the email OTP step.
  if (isPasswordOnlyTestLogin(email)) {
    const next = safeInternalPath(formData.get("next"), "/board");
    redirect(next);
  }

  await supabase.auth.signOut();

  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (otpError) {
    const parsed = otpSendError(otpError.message);
    return {
      ok: false as const,
      error: parsed.message,
      waitSeconds: parsed.waitSeconds,
    };
  }

  return { ok: true as const, email, waitSeconds: null as number | null };
}

export async function resendLoginCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const guard = await checkBotGuard(formData, await requestIp(), "login");
  if (!guard.ok) {
    return { ok: false as const, error: guard.error, waitSeconds: null as number | null };
  }
  if (!email) {
    return {
      ok: false as const,
      error: "Enter a valid email.",
      waitSeconds: null as number | null,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) {
    const parsed = otpSendError(error.message);
    return {
      ok: false as const,
      error: parsed.message,
      waitSeconds: parsed.waitSeconds,
    };
  }

  return { ok: true as const, email, waitSeconds: null as number | null };
}

export async function confirmLoginCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");
  const next = safeInternalPath(formData.get("next"), "/board");
  const guard = await checkBotGuard(formData, await requestIp(), "login");
  if (!guard.ok) {
    return { ok: false as const, error: guard.error, waitSeconds: null as number | null };
  }
  if (!email) {
    return {
      ok: false as const,
      error: "Enter a valid email.",
      waitSeconds: null as number | null,
    };
  }
  if (!/^\d{6}$/.test(token)) {
    return {
      ok: false as const,
      error: "Enter the 6-digit code from your email.",
      waitSeconds: null as number | null,
    };
  }

  const supabase = await createClient();
  const { error } = await verifyEmailOtp(supabase, email, token);
  if (error) {
    return {
      ok: false as const,
      error: "That code did not match. Try again.",
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

  if (!email || password.length < 8) {
    redirect(
      `/signup?error=${encodeURIComponent("Enter a valid email and a password of at least 8 characters")}`,
    );
  }

  const siteUrl = await resolveAppUrlFromHeaders();
  const admin = createAdminClient();
  const fullName = displayName || email.split("@")[0] || "Maker";

  // Generate token without Supabase auto-mailing (prevents Dozen + Supabase doubles).
  // Build our own callback URL with token_hash so verifyOtp can set the SSR session.
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
  const emailOtp = linkData.properties?.email_otp;
  if (!hashedToken || !emailOtp) {
    redirect(
      `/signup?error=${encodeURIComponent("Could not create confirmation code. Try again.")}`,
    );
  }

  const confirmUrl = new URL(`${siteUrl}/auth/callback`);
  confirmUrl.searchParams.set("token_hash", hashedToken);
  confirmUrl.searchParams.set("type", "signup");
  confirmUrl.searchParams.set("next", next);

  const confirmPageUrl = new URL(`${siteUrl}/signup/confirm`);
  confirmPageUrl.searchParams.set("email", email);
  confirmPageUrl.searchParams.set("next", next);

  const mailed = await sendSignupConfirmEmail({
    to: email,
    confirmUrl: confirmUrl.toString(),
    code: emailOtp,
    confirmPageUrl: confirmPageUrl.toString(),
    displayName: fullName,
  });
  if (!mailed.ok) {
    redirect(
      `/signup?error=${encodeURIComponent(mailed.error || "Could not send confirmation email")}`,
    );
  }

  redirect(confirmPageUrl.pathname + confirmPageUrl.search);
}

export async function confirmSignupCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");
  const next = safeInternalPath(formData.get("next"), "/board");
  const guard = await checkBotGuard(formData, await requestIp(), "signup");
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
  let verified = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });
  if (verified.error) {
    verified = await verifyEmailOtp(supabase, email, token);
  }
  if (verified.error) {
    return {
      ok: false as const,
      error: "That code did not match. Try again.",
    };
  }

  const user = verified.data.user;
  if (user) {
    try {
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existing) {
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Maker";
        await admin.from("profiles").insert({
          id: user.id,
          email: user.email ?? "",
          display_name: String(name).slice(0, 40),
        });
      }
    } catch {
      // Non-fatal
    }
  }

  redirect(next);
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
