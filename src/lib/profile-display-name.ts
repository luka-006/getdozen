import type { User } from "@supabase/supabase-js";

export function profileDisplayNameFromUser(
  user: Pick<User, "user_metadata" | "email">,
): string {
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Maker";
  return String(name).slice(0, 40);
}
