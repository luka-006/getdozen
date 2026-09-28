import Link from "next/link";
import type { Metadata } from "next";
import { ProfileReviewForm } from "@/components/profile-review-form";
import { TesterExperienceForm } from "@/components/tester-experience-form";
import { requireProfile } from "@/lib/auth";
import { formatDotsDelta } from "@/lib/currency";
import { haveInteracted } from "@/lib/profile-reviews";
import { pageMetadata } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { testerCompletionEarnAmount } from "@/lib/tester-checkin";
import type { RequestRow } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return pageMetadata({
    title: "Test complete",
    description: "Share feedback after finishing a closed test on Dozen.",
    path: `/testers/complete/${id}`,
    index: false,
  });
}

export default async function TesterCompletePage({ params, searchParams }: Props) {
  const profile = await requireProfile();
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: commitment } = await supabase
    .from("tester_commitments")
    .select("*")
    .eq("id", id)
    .single();

  if (!commitment || commitment.tester_id !== profile.id) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-12">
        <p>Test not found.</p>
        <Link href="/testers" className="btn btn-secondary mt-6">
          My tests
        </Link>
      </div>
    );
  }

  if (commitment.status !== "completed") {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-12">
        <p>This test is not finished yet.</p>
        <Link href="/testers" className="btn btn-secondary mt-6">
          My tests
        </Link>
      </div>
    );
  }

  const { data: request } = await admin
    .from("requests")
    .select("*")
    .eq("id", commitment.request_id)
    .single();

  const requestRow = request as RequestRow | null;
  const multiplier = Number(requestRow?.bounty_multiplier ?? 1) || 1;
  const dotsEarned = testerCompletionEarnAmount(multiplier);
  const makerId = requestRow?.user_id;

  const [maker, canReview, existingPeerReview] = await Promise.all([
    makerId
      ? admin
          .from("profiles")
          .select("id, display_name")
          .eq("id", makerId)
          .maybeSingle()
      : Promise.resolve(null),
    makerId ? haveInteracted(profile.id, makerId) : Promise.resolve(false),
    makerId
      ? admin
          .from("profile_reviews")
          .select("id, body, rating")
          .eq("from_user_id", profile.id)
          .eq("to_user_id", makerId)
          .maybeSingle()
      : Promise.resolve(null),
  ]);

  const makerName = maker?.display_name?.trim() || "the maker";
  const experienceRating = commitment.experience_rating ?? null;

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-12">
      <p className="eyebrow">Test complete</p>
      <h1 className="mt-2 font-display text-[32px] font-semibold leading-tight">
        {requestRow?.app_name ?? "Your test"}
      </h1>
      <p className="mt-3 text-[15px] text-ink/75">
        <span className="rounded-[6px] bg-credit px-1.5 py-0.5 font-mono">
          {formatDotsDelta(dotsEarned)}
        </span>{" "}
        added to your wallet for finishing this test.
      </p>

      {query.error ? (
        <p className="mt-4 text-[13px] text-flag">{query.error}</p>
      ) : null}
      {query.message ? (
        <p className="mt-4 text-[13px] text-ink/80">{query.message}</p>
      ) : null}

      <div className="mt-8 space-y-6">
        <TesterExperienceForm
          commitmentId={commitment.id}
          initialRating={experienceRating}
        />

        {canReview && makerId ? (
          existingPeerReview ? (
            <div className="surface space-y-2 p-4">
              <h3 className="font-display text-[18px] font-semibold">
                Peer note for {makerName}
              </h3>
              <p className="text-[14px] text-ink/75">{existingPeerReview.body}</p>
              {existingPeerReview.rating ? (
                <p className="font-mono text-[13px] text-ink/60">
                  {existingPeerReview.rating}★
                </p>
              ) : null}
              <Link
                href={`/profile/${makerId}`}
                className="text-[13px] text-blue"
              >
                View on profile →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h2 className="font-display text-[22px] font-semibold">
                  Leave a peer note
                </h2>
                <p className="mt-1 text-[14px] text-ink/65">
                  Optional note for {makerName} about working together on this
                  test.
                </p>
              </div>
              <ProfileReviewForm
                toUserId={makerId}
                returnPath={`/testers/complete/${commitment.id}`}
              />
            </div>
          )
        ) : null}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/wallet" className="btn btn-primary">
          Wallet
        </Link>
        <Link href="/testers" className="btn btn-secondary">
          My tests
        </Link>
        {requestRow ? (
          <Link href={`/requests/${requestRow.id}`} className="btn btn-secondary">
            View post
          </Link>
        ) : null}
      </div>
    </div>
  );
}
