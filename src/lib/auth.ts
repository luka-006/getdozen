import { cache } from "react";
import { redirect } from "next/navigation";
import { bootstrapAccountRewards, settleLaunchRewards } from "@/lib/account-rewards";
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

  let { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  try {
    if (!data) {
      await bootstrapAccountRewards({
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      });
      const again = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      data = again.data;
    } else {
      const settled = await settleLaunchRewards(user.id);
      if (settled.waitlist_granted || settled.referral_paid > 0) {
        const again = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        data = again.data ?? data;
      }
    }
  } catch (err) {
    console.error("account rewards", err);
  }

  return data as Profile | null;
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.is_banned) redirect("/banned");
  return profile;
}
