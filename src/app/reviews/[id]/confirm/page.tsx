import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { awardReviewBug, confirmReview, sendThanks } from "@/actions/reviews";
import { requireProfile } from "@/lib/auth";
import { BUG_REPORT_AWARD } from "@/lib/constants";
import { currencyName, formatDots } from "@/lib/currency";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDistanceToNowStrict } from "date-fns";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

async function getReciprocityLine(params: {
  requesterId: string;
  reviewerId: string;
  currentReviewId: string;
}): Promise<string | null> {
  const admin = createAdminClient();

  const [{ data: reviewerRequests }, { data: requesterRequests }] =
    await Promise.all([
      admin.from("requests").select("id").eq("user_id", params.reviewerId),
      admin.from("requests").select("id").eq("user_id", params.requesterId),
    ]);

  const theirRequestIds = (reviewerRequests ?? []).map((r) => r.id);
  const yourRequestIds = (requesterRequests ?? []).map((r) => r.id);

  let youReviewedThem = false;
  if (theirRequestIds.length > 0) {
    const { data } = await admin
      .from("reviews")
      .select("id")
      .eq("reviewer_id", params.requesterId)
      .in("request_id", theirRequestIds)
      .limit(1);
    youReviewedThem = (data ?? []).length > 0;
  }

  let theyReviewedYoursEarlier = false;
  if (yourRequestIds.length > 0) {
    const { data } = await admin
      .from("reviews")
      .select("id")
      .eq("reviewer_id", params.reviewerId)
      .in("request_id", yourRequestIds)
      .neq("id", params.currentReviewId)
      .limit(1);
    theyReviewedYoursEarlier = (data ?? []).length > 0;
  }

  if (youReviewedThem) {
    return "You reviewed their app earlier. They reviewed yours today.";
  }
  if (theyReviewedYoursEarlier) {
    return "They reviewed your app earlier. You are confirming another review today.";
  }
  return null;
}

export default async function ConfirmReviewPage({ params, searchParams }: Props) {
  const profile = await requireProfile();
  const { id } = await params;
  const query = await searchParams;
  const admin = createAdminClient();

  const { data: review } = await admin
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single();

  if (!review) notFound();

  const { data: request } = await admin
    .from("requests")
    .select("*")
    .eq("id", review.request_id)
    .single();

  if (!request || request.user_id !== profile.id) {
    redirect("/board?error=Not%20allowed");
  }

  const { data: questions } = await admin
    .from("questions")
    .select("id, text")
    .in("id", review.sample_question_ids);

  const { data: reviewer } = await admin
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", review.reviewer_id)
    .single();

  const reciprocityLine = await getReciprocityLine({
    requesterId: profile.id,
    reviewerId: review.reviewer_id,
    currentReviewId: review.id,
  });

  const answers = review.answers as Record<string, string>;
  const remaining = formatDistanceToNowStrict(new Date(review.auto_confirm_at), {
    addSuffix: true,
  });

  const { data: bugAward } = await admin
    .from("credit_ledger")
    .select("id")
    .eq("reason", "review_bug_award")
    .eq("ref_id", review.id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <p className="text-[13px] text-ink/55">
        <Link href={`/requests/${request.id}`} className="text-blue">
          {request.app_name}
        </Link>{" "}
        / confirm
      </p>
      <h1 className="mt-2 font-display text-[32px] font-semibold">Confirm review</h1>
      <p className="mt-2 text-ink/75">
        From{" "}
        <Link href={`/profile/${reviewer?.id}`} className="text-blue">
          {reviewer?.display_name}
        </Link>
        . Did this person clearly actually use the product?
      </p>
      {reciprocityLine ? (
        <p className="mt-2 text-[14px] text-blue">{reciprocityLine}</p>
      ) : null}
      <p className="mt-2 font-mono text-[13px] text-ink/60">
        Auto-confirms {remaining}
      </p>

      {query.error ? (
        <p className="mt-4 text-[13px] text-flag">{query.error}</p>
      ) : null}
      {query.message ? (
        <p className="mt-4 text-[13px] text-ink/80">{query.message}</p>
      ) : null}

      <div className="mt-8 space-y-4">
        {(questions ?? []).map((q) => (
          <div key={q.id} className="well px-4 py-3">
            <p className="text-[13px] font-medium">{q.text}</p>
            <p className="mt-2 whitespace-pre-wrap text-[15px]">
              {answers[q.id] ?? "—"}
            </p>
          </div>
        ))}
      </div>

      {review.confirm_status === "pending" ? (
        <form action={confirmReview} className="mt-8 space-y-4">
          <input type="hidden" name="review_id" value={review.id} />
          <div className="field">
            <label htmlFor="rating">Rating (optional)</label>
            <select id="rating" name="rating" className="select font-mono" defaultValue="">
              <option value="">No rating</option>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              name="decision"
              value="confirm"
              className="btn btn-primary"
            >
              Confirm review
            </button>
            <button
              type="submit"
              name="decision"
              value="reject"
              className="btn btn-danger"
            >
              Reject review
            </button>
          </div>
          <p className="text-[13px] text-ink/60">
            Rejection does not refund your {currencyName()}.
          </p>
        </form>
      ) : (
        <p className="mt-8 font-mono text-[13px]">
          Status: {review.confirm_status}
        </p>
      )}

      {review.confirm_status !== "rejected" ? (
        bugAward ? (
          <p className="mt-6 text-[13px] text-ink/60">
            Awarded {formatDots(BUG_REPORT_AWARD)} for a proper bug report
          </p>
        ) : (
          <form action={awardReviewBug} className="mt-6">
            <input type="hidden" name="review_id" value={review.id} />
            <button type="submit" className="btn btn-secondary">
              Award {formatDots(BUG_REPORT_AWARD)}
            </button>
            <p className="mt-2 text-[12px] text-ink/55">
              If this review includes a real bug, award {formatDots(BUG_REPORT_AWARD)}.
            </p>
          </form>
        )
      ) : null}

      {review.confirm_status === "confirmed" ? (
        <form action={sendThanks} className="mt-8 space-y-3">
          <input type="hidden" name="review_id" value={review.id} />
          <div className="field">
            <label htmlFor="body">Say thanks</label>
            <textarea
              id="body"
              name="body"
              className="textarea"
              maxLength={280}
              placeholder="One short message back to whoever helped you."
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Send thanks
          </button>
        </form>
      ) : null}
    </div>
  );
}
