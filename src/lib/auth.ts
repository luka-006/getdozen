import { cache } from "react";
import { redirect } from "next/navigation";
import { profileDisplayNameFromUser } from "@/lib/profile-display-name";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data as Profile | null;
});

export async function ensureProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing as Profile;

  try {
    const admin = createAdminClient();
    const { data: inserted, error } = await admin
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? "",
        display_name: profileDisplayNameFromUser(user),
      })
      .select("*")
      .single();

    if (error) throw error;
    return inserted as Profile;
  } catch {
    return null;
  }
}

export async function requireProfile(): Promise<Profile> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await ensureProfile();
  if (!profile) {
    throw new Error("Unable to load profile for authenticated user");
  }
  if (profile.is_banned) redirect("/banned");
  return profile;
}
