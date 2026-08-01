import { TESTER_COST } from "@/lib/constants";
import { appendLedger } from "@/lib/credits";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * After escalate_bounties marks open requests expired, refund unused tester
 * slots (2 cr each, capped at the request's credit_cost). Idempotent via ledger.
 */
export async function refundUnusedTesterSlots() {
  const admin = createAdminClient();
  const { data: expired } = await admin
    .from("requests")
    .select("id, user_id, type, testers_needed, testers_filled, credit_cost")
    .eq("status", "expired")
    .in("type", ["tester", "combo"]);

  for (const req of expired ?? []) {
    const unused = Math.max(
      0,
      Number(req.testers_needed) - Number(req.testers_filled),
    );
    if (unused <= 0) continue;

    const { data: existing } = await admin
      .from("credit_ledger")
      .select("id")
      .eq("ref_id", req.id)
      .eq("reason", "unused_tester_refund")
      .maybeSingle();
    if (existing) continue;

    const refund = Math.min(unused * TESTER_COST, Number(req.credit_cost));
    if (refund <= 0) continue;

    await appendLedger({
      userId: req.user_id,
      amount: refund,
      reason: "unused_tester_refund",
      refId: req.id,
      status: "available",
    });
  }
}
