import { BUG_REPORT_AWARD } from "@/lib/constants";
import { appendLedger } from "@/lib/credits";
import { formatDots } from "@/lib/currency";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function bumpBugsFound(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("bugs_found")
    .eq("id", userId)
    .maybeSingle();
  await admin
    .from("profiles")
    .update({ bugs_found: Number(data?.bugs_found ?? 0) + 1 })
    .eq("id", userId);
}

export async function grantBugReportAward(bugId: string) {
  if (!UUID_RE.test(bugId)) {
    return { ok: false as const, message: "Unknown report" };
  }

  const admin = createAdminClient();
  const { data: bug } = await admin
    .from("site_bug_reports")
    .select("id, user_id, email, awarded_at")
    .eq("id", bugId)
    .maybeSingle();

  if (!bug) return { ok: false as const, message: "Unknown report" };
  if (bug.awarded_at) return { ok: true as const, message: "Already awarded" };

  let userId = (bug.user_id as string | null) ?? null;
  const email = String(bug.email ?? "").trim().toLowerCase();
  if (!userId && email) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    userId = profile?.id ?? null;
  }
  if (!userId) {
    return { ok: false as const, message: "No account to credit" };
  }

  const { data: existing } = await admin
    .from("credit_ledger")
    .select("id")
    .eq("reason", "bug_report_award")
    .eq("ref_id", bugId)
    .maybeSingle();

  if (!existing) {
    await appendLedger({
      userId,
      amount: BUG_REPORT_AWARD,
      reason: "bug_report_award",
      refId: bugId,
      status: "available",
    });
    await bumpBugsFound(userId);
  }

  await admin
    .from("site_bug_reports")
    .update({
      awarded_at: new Date().toISOString(),
      awarded_credits: BUG_REPORT_AWARD,
      user_id: userId,
    })
    .eq("id", bugId);

  return { ok: true as const, message: `Awarded ${formatDots(BUG_REPORT_AWARD)}` };
}

export async function grantReviewBugAward(reviewId: string, actorId: string) {
  if (!UUID_RE.test(reviewId)) {
    return { ok: false as const, message: "Unknown review" };
  }

  const admin = createAdminClient();
  const { data: review } = await admin
    .from("reviews")
    .select("id, reviewer_id, request_id, confirm_status")
    .eq("id", reviewId)
    .maybeSingle();

  if (!review) return { ok: false as const, message: "Unknown review" };
  if (review.confirm_status === "rejected") {
    return { ok: false as const, message: "Rejected reviews cannot be awarded" };
  }

  const { data: request } = await admin
    .from("requests")
    .select("user_id")
    .eq("id", review.request_id)
    .maybeSingle();

  if (!request || request.user_id !== actorId) {
    return { ok: false as const, message: "Not allowed" };
  }

  const { data: existing } = await admin
    .from("credit_ledger")
    .select("id")
    .eq("reason", "review_bug_award")
    .eq("ref_id", reviewId)
    .maybeSingle();

  if (existing) return { ok: true as const, message: "Already awarded" };

  await appendLedger({
    userId: review.reviewer_id,
    amount: BUG_REPORT_AWARD,
    reason: "review_bug_award",
    refId: reviewId,
    status: "available",
  });
  await bumpBugsFound(review.reviewer_id);

  return { ok: true as const, message: `Awarded ${formatDots(BUG_REPORT_AWARD)}` };
}
