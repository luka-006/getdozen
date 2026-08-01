import { createAdminClient } from "@/lib/supabase/admin";

export async function haveInteracted(a: string, b: string): Promise<boolean> {
  if (!a || !b || a === b) return false;
  const admin = createAdminClient();

  const { data: ownedByB } = await admin
    .from("requests")
    .select("id")
    .eq("user_id", b);
  const bRequestIds = (ownedByB ?? []).map((r) => r.id);
  if (bRequestIds.length > 0) {
    const { data: reviewed } = await admin
      .from("reviews")
      .select("id")
      .eq("reviewer_id", a)
      .in("request_id", bRequestIds)
      .limit(1);
    if (reviewed?.length) return true;

    const { data: tested } = await admin
      .from("tester_commitments")
      .select("id")
      .eq("tester_id", a)
      .in("request_id", bRequestIds)
      .limit(1);
    if (tested?.length) return true;
  }

  const { data: ownedByA } = await admin
    .from("requests")
    .select("id")
    .eq("user_id", a);
  const aRequestIds = (ownedByA ?? []).map((r) => r.id);
  if (aRequestIds.length > 0) {
    const { data: reviewed } = await admin
      .from("reviews")
      .select("id")
      .eq("reviewer_id", b)
      .in("request_id", aRequestIds)
      .limit(1);
    if (reviewed?.length) return true;

    const { data: tested } = await admin
      .from("tester_commitments")
      .select("id")
      .eq("tester_id", b)
      .in("request_id", aRequestIds)
      .limit(1);
    if (tested?.length) return true;
  }

  return false;
}
