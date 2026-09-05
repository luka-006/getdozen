import Link from "next/link";
import { ReviewNextPosts } from "@/components/review-next-posts";
import { FIRST_REVIEW_GIFT } from "@/lib/constants";
import { requireProfile } from "@/lib/auth";
import { suggestNextReviewPosts } from "@/lib/board-suggestions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatDots, formatDotsDelta } from "@/lib/currency";
import type { RequestRow } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function ReviewSubmittedPage({
  params,
  searchParams,
}: Props) {
  const profile = await requireProfile();
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: review } = await supabase
    .from("reviews")
    .select("id, credits_awarded, auto_confirm_at, reviewer_id, confirm_status, request_id")
    .eq("id", id)
    .single();

  if (!review || review.reviewer_id !== profile.id) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-12">
        <p>Review not found.</p>
      </div>
    );
  }

  const confirmed = review.confirm_status === "confirmed";
  const { data: gift } = await supabase
    .from("credit_ledger")
    .select("id")
    .eq("user_id", profile.id)
    .eq("reason", "first_review_gift")
    .eq("ref_id", id)
    .maybeSingle();
  const firstCelebrate =
    Boolean(gift) ||
    (confirmed && Number(profile.reviews_given) <= 1);

  const [{ data: openRequests }, { data: myReviews }] = await Promise.all([
    admin.from("requests").select("*").eq("status", "open"),
    admin.from("reviews").select("request_id").eq("reviewer_id", profile.id),
  ]);

  const comboIds = (openRequests ?? [])
    .filter((r) => r.type === "combo")
    .map((r) => r.id);
  const { data: comboReviewRows } = comboIds.length
    ? await admin.from("reviews").select("request_id").in("request_id", comboIds)
    : { data: [] as { request_id: string }[] };

  const reviewedIds = new Set((myReviews ?? []).map((r) => r.request_id));
  const comboTakenIds = new Set(
    (comboReviewRows ?? []).map((r) => r.request_id),
  );

  const nextPosts = suggestNextReviewPosts((openRequests ?? []) as RequestRow[], {
    meId: profile.id,
    reviewedIds,
    comboTakenIds,
    excludeRequestId: query.from ?? review.request_id,
    limit: 3,
  }).map((r) => ({
    id: r.id,
    app_name: r.app_name,
    app_icon_url: r.app_icon_url,
    app_description: r.app_description,
    platform: r.platform,
    question_count: r.question_count,
    bounty_multiplier: Number(r.bounty_multiplier),
  }));

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-12">
      <ReviewNextPosts posts={nextPosts} />

      <h1 className="font-display text-[32px] font-semibold">
        {firstCelebrate && confirmed ? "First review unlocked" : "Review submitted"}
      </h1>
      <p className="mt-3 text-ink/75">
        <span className="rounded-[6px] bg-credit px-1.5 py-0.5 font-mono">
          {formatDots(Number(review.credits_awarded ?? 0))}
        </span>{" "}
        {confirmed ? "added to your wallet" : "pending · confirms in 48h"}
      </p>
      {firstCelebrate && confirmed ? (
        <p className="mt-4 text-[15px] text-ink/75">
          Welcome gift:{" "}
          <span className="rounded-[6px] bg-credit px-1.5 py-0.5 font-mono">
            {formatDotsDelta(FIRST_REVIEW_GIFT)}
          </span>
          . You can buy packs now.
        </p>
      ) : null}
      <div className="mt-8 flex gap-3">
        <Link href="/board?type=feedback" className="btn btn-primary">
          Board
        </Link>
        <Link href="/wallet" className="btn btn-secondary">
          Wallet
        </Link>
      </div>
    </div>
  );
}
