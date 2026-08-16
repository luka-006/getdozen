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
  await assertHuman(formData, "/login", { next });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
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
  await assertHuman(formData, "/signup", { next });

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
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: displayName || email.split("@")[0],
      },
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
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
  await assertHuman(formData, "/login/forgot");
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
