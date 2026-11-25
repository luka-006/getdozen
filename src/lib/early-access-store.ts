import { createAdminClient } from "@/lib/supabase/admin";
import type { EarlyAccessFlag } from "@/lib/early-access";

/** First write sets the timestamp. A row that is already flagged is left as it was. */
export async function flagWaitlistEarlyAccess(
  id: string,
  atIso: string,
): Promise<EarlyAccessFlag> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("waitlist")
    .update({
      early_access_requested: true,
      early_access_requested_at: atIso,
      updated_at: atIso,
    })
    .eq("id", id)
    .eq("early_access_requested", false)
    .select("id");

  if (error) throw new Error(error.message);
  if ((data?.length ?? 0) > 0) return "set";

  const existing = await admin
    .from("waitlist")
    .select("early_access_requested")
    .eq("id", id)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.early_access_requested) return "already";
  return "missing";
}
