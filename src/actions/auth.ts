"use server";

import { redirect } from "next/navigation";
import { resolveAppUrlFromHeaders } from "@/lib/app-url";
import { assertHuman } from "@/lib/assert-human";
import { isLaunchOpen } from "@/lib/launch";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safe-path";

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeInternalPath(formData.get("next"), "/board");
  await assertHuman(formData, "/login", { next }, "login");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const hint = /invalid login credentials/i.test(error.message)
      ? "Wrong email or password. If you joined with Google, use Continue with Google — or Forgot to set a password."
      : error.message;
    redirect(`/login?error=${encodeURIComponent(hint)}&next=${encodeURIComponent(next)}`);
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
