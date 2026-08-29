import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { joinTesterRequest } from "@/actions/testers";
import { purchaseBoardBoost } from "@/actions/billing";
import { AnswerInsights } from "@/components/answer-insights";
import { TesterProgressRow } from "@/components/day-strip";
import { PackProgress } from "@/components/pack-progress";
import { requireProfile } from "@/lib/auth";
import { aggregateQuestionChipInsights } from "@/lib/chip-analytics";
import { pageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOST_HOURS, TESTER_DAYS, reviewEarnForQuestionCount } from "@/lib/constants";
import { decryptCredentials } from "@/lib/crypto";
import { canBuyBoardBoost, isBoostActive } from "@/lib/boost";
import { BOOST_PRICE_EUR } from "@/lib/pricing";
import { formatCredits, formatWait } from "@/lib/utils";
import type { RequestRow, TesterCommitment } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("requests")
    .select("app_name")
    .eq("id", id)
    .single();
  const name = data?.app_name?.trim() || "Request";
  return pageMetadata({
    title: name,
    description: `${name} on Dozen.`,
    path: `/requests/${id}`,
    index: false,
  });
}

export default async function RequestDetailPage({ params, searchParams }: Props) {
  const profile = await requireProfile();
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!request) notFound();
  const row = request as RequestRow;
  const isOwner = row.user_id === profile.id;

  const { data: owner } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", row.user_id)
    .single();

  let credentials: string | null = null;
  if (!isOwner && (row.type === "feedback" || row.type === "combo") && row.status === "open") {
    // credentials stay encrypted until review starts; detail page only hints
  }

  if (isOwner && row.test_credentials_encrypted) {
    try {
      const admin = createAdminClient();
      const { data: full } = await admin
        .from("requests")
        .select("test_credentials_encrypted")
        .eq("id", id)
        .single();
      if (full?.test_credentials_encrypted) {
        credentials = decryptCredentials(full.test_credentials_encrypted);
      }
    } catch {
      credentials = null;
    }
  }

  let commitments: TesterCommitment[] = [];
  let testerNames = new Map<string, string>();
  let myCommitment: TesterCommitment | null = null;
  if (row.type === "tester" || row.type === "combo") {
    if (isOwner) {
      const admin = createAdminClient();
      const { data } = await admin
        .from("tester_commitments")
        .select("*")
        .eq("request_id", id)
        .order("opted_in_at", { ascending: true });
      commitments = (data ?? []) as TesterCommitment[];
      const testerIds = [...new Set(commitments.map((c) => c.tester_id))];
      if (testerIds.length) {
        const { data: testers } = await admin
          .from("profiles")
          .select("id, display_name")
          .in("id", testerIds);
        testerNames = new Map(
          (testers ?? []).map((t) => [t.id, t.display_name]),
        );
      }
    } else {
      const { data } = await supabase
        .from("tester_commitments")
        .select("*")
        .eq("request_id", id)
        .eq("tester_id", profile.id)
        .maybeSingle();
      myCommitment = (data as TesterCommitment | null) ?? null;
    }
  }

  let hasReview = false;
  let reviewConfirmed = false;
  if (row.type === "feedback" || row.type === "combo") {
    const { data: reviewRows } = await supabase
      .from("reviews")
      .select("id, confirm_status")
      .eq("request_id", id)
      .limit(5);
    hasReview = (reviewRows?.length ?? 0) > 0;
    reviewConfirmed = (reviewRows ?? []).some(
      (r) => r.confirm_status === "confirmed",
    );
  }

  let peerNotes: { body: string; rating: number | null }[] = [];
  let chipInsights: ReturnType<typeof aggregateQuestionChipInsights> = [];
  if (
    !isOwner &&
    (row.type === "feedback" || row.type === "combo") &&
    row.status === "open" &&
    !hasReview
  ) {
    const { data: notes } = await supabase
      .from("profile_reviews")
      .select("body, rating")
      .eq("to_user_id", row.user_id)
      .order("created_at", { ascending: false })
      .limit(3);
    peerNotes = (notes ?? []) as { body: string; rating: number | null }[];
  }

  if (
    isOwner &&
    (row.type === "feedback" || row.type === "combo") &&
    hasReview
  ) {
    const admin = createAdminClient();
    const { data: questions } = await admin
      .from("questions")
      .select("id, text, position, is_proof, suggested_answers")
      .eq("request_id", id)
      .order("position");
    const { data: reviewRows } = await admin
      .from("reviews")
      .select("answers, chip_clicks")
      .eq("request_id", id);
    chipInsights = aggregateQuestionChipInsights(
      questions ?? [],
      reviewRows ?? [],
    );
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <p className="text-[13px] text-ink/55">
        <Link href="/board" className="text-blue">
          Board
        </Link>{" "}
        / request
      </p>
      <div className="mt-3">
        <p className="eyebrow">Feedback request</p>
        <h1 className="mt-2 font-display text-[34px] font-semibold leading-tight sm:text-[38px]">
          {row.app_name}
        </h1>
      </div>
      <p className="mt-3 text-[16px] leading-relaxed text-ink/75">{row.app_description}</p>

      {query.error ? (
        <p className="mt-4 text-[13px] text-flag">{query.error}</p>
      ) : null}
      {query.message ? (
        <p className="mt-4 text-[13px] text-ink/80">{query.message}</p>
      ) : null}

      {isOwner && row.status === "open" && isBoostActive(row.boosted_until) ? (
        <p className="mt-4 text-[13px] text-ink/70">
          On top of the board until{" "}
          {new Date(row.boosted_until!).toLocaleString()}
        </p>
      ) : null}

      {isOwner &&
      row.status === "open" &&
      !isBoostActive(row.boosted_until) &&
      canBuyBoardBoost(row.created_at) ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-border bg-mist px-4 py-3">
          <p className="text-[13px] text-ink/75">
            Pin this post to the top of the board for {BOOST_HOURS} hours · €
            {BOOST_PRICE_EUR}.
          </p>
          <form action={purchaseBoardBoost}>
            <input type="hidden" name="request_id" value={row.id} />
            <button type="submit" className="btn btn-secondary">
              Boost €{BOOST_PRICE_EUR}
            </button>
          </form>
        </div>
      ) : null}

      <dl className="stat-grid mt-8">
        <div className="stat-cell">
          <dt className="text-ink/60">Posted by</dt>
          <dd>
            <Link href={`/profile/${owner?.id}`} className="text-blue">
              {owner?.display_name}
            </Link>
          </dd>
        </div>
        <div className="stat-cell">
          <dt className="text-ink/60">App</dt>
          <dd className="text-ink/70 truncate">{row.app_url}</dd>
        </div>
        <div className="stat-cell">
          <dt className="text-ink/60">Waiting</dt>
          <dd className="font-mono">{formatWait(row.created_at)}</dd>
        </div>
        {row.type === "feedback" ? (
          <>
            <div className="stat-cell">
              <dt className="text-ink/60">Questions</dt>
              <dd className="font-mono">{row.question_count}</dd>
            </div>
            <div className="stat-cell">
              <dt className="text-ink/60">Posted for</dt>
              <dd>
                <span className="pill-credit font-mono">
                  {formatCredits(Number(row.credit_cost))}
                </span>
              </dd>
            </div>
            <div className="stat-cell">
              <dt className="text-ink/60">Reviewer earn</dt>
              <dd>
                <span className="pill-credit font-mono">
                  {formatCredits(
                    reviewEarnForQuestionCount(row.question_count) *
                      Number(row.bounty_multiplier),
                  )}
                </span>
                {Number(row.bounty_multiplier) > 1 ? (
                  <span className="ml-2 text-[13px] text-ink/60">
                    {row.bounty_multiplier}× bounty
                  </span>
                ) : null}
              </dd>
            </div>
          </>
        ) : row.type === "combo" ? (
          <>
            <div className="stat-cell">
              <dt className="text-ink/60">Testers</dt>
              <dd className="font-mono">
                {row.testers_filled} / {row.testers_needed}
              </dd>
            </div>
            <div className="stat-cell">
              <dt className="text-ink/60">Test length</dt>
              <dd className="font-mono">
                {row.duration_days ?? TESTER_DAYS} days
              </dd>
            </div>
            <div className="stat-cell">
              <dt className="text-ink/60">Questions</dt>
              <dd className="font-mono">{row.question_count}</dd>
            </div>
            <div className="stat-cell">
              <dt className="text-ink/60">Pack cost</dt>
              <dd>
                <span className="pill-credit font-mono">
                  {formatCredits(Number(row.credit_cost))}
                </span>
              </dd>
            </div>
            <div className="stat-cell">
              <dt className="text-ink/60">Focus</dt>
              <dd>{row.test_focus}</dd>
            </div>
          </>
        ) : (
          <>
            <div className="stat-cell">
              <dt className="text-ink/60">Testers</dt>
              <dd className="font-mono">
                {row.testers_filled} / {row.testers_needed}
              </dd>
            </div>
            <div className="stat-cell">
              <dt className="text-ink/60">Test length</dt>
              <dd className="font-mono">
                {row.duration_days ?? TESTER_DAYS} days
              </dd>
            </div>
            <div className="stat-cell">
              <dt className="text-ink/60">Focus</dt>
              <dd>{row.test_focus}</dd>
            </div>
          </>
        )}
      </dl>

      {isOwner && credentials ? (
        <div className="mt-6 well px-4 py-3">
          <p className="text-[13px] font-medium">Throwaway login (you)</p>
          <p className="mt-1 font-mono text-[13px] whitespace-pre-wrap">{credentials}</p>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={row.app_url}
          className="btn btn-secondary"
          target="_blank"
          rel="noreferrer"
        >
          Open app
        </a>
        {!isOwner &&
        (row.type === "feedback" || row.type === "combo") &&
        row.status === "open" &&
        !hasReview ? (
          <Link href={`/requests/${row.id}/review`} className="btn btn-primary">
            Start review
          </Link>
        ) : null}
      </div>

      {peerNotes.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-[20px] font-semibold">
            Notes on this maker
          </h2>
          <p className="mt-1 text-[13px] text-ink/60">
            From peers who already worked with them.
          </p>
          <ul className="mt-4 space-y-3">
            {peerNotes.map((note, i) => (
              <li key={i} className="border-b border-border py-3 text-[14px]">
                <p className="text-ink/80">{note.body}</p>
                {note.rating ? (
                  <p className="mt-1 font-mono text-[12px] text-ink/50">
                    {note.rating}/5
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!isOwner &&
      (row.type === "tester" || row.type === "combo") &&
      row.status === "open" &&
      !myCommitment ? (
        <form action={joinTesterRequest} className="mt-8 space-y-4">
          <input type="hidden" name="request_id" value={row.id} />
          <div className="field">
            <label htmlFor="google_email">Google account for opt-in</label>
            <input
              id="google_email"
              name="google_email"
              type="email"
              className="input"
              required
              placeholder="you@gmail.com"
            />
          </div>
          {row.opt_in_link ? (
            <a
              href={row.opt_in_link}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              Open opt-in link
            </a>
          ) : null}
          <button type="submit" className="btn btn-primary">
            Start commitment
          </button>
        </form>
      ) : null}

      {!isOwner && myCommitment?.status === "active" ? (
        <p className="mt-8 text-[13px] text-ink/70">
          You are already on this test.{" "}
          <Link href="/testers" className="text-blue">
            Open My tests
          </Link>{" "}
          to check in.
        </p>
      ) : null}

      {isOwner && row.type === "combo" ? (
        <PackProgress
          hasReview={hasReview}
          reviewConfirmed={reviewConfirmed}
          testersFilled={row.testers_filled}
          testersNeeded={row.testers_needed}
          expiresAt={row.expires_at}
          creditCost={Number(row.credit_cost)}
        />
      ) : null}

      {(row.type === "tester" || row.type === "combo") ? (
        <section className="mt-10 space-y-4">
          <h2 className="font-display text-[24px] font-semibold">
            Tester progress
          </h2>
          <p className="text-[13px] text-ink/60">
            Each tester starts their own {row.duration_days ?? TESTER_DAYS}-day
            clock on the day they join.
          </p>
          {isOwner ? (
            commitments.length === 0 ? (
              <p className="text-[13px] text-ink/55">No testers yet.</p>
            ) : (
              commitments.map((c) => (
                <TesterProgressRow
                  key={c.id}
                  name={testerNames.get(c.tester_id) ?? "Tester"}
                  href={`/profile/${c.tester_id}`}
                  optedInAt={c.opted_in_at}
                  durationDays={
                    c.duration_days ?? row.duration_days ?? TESTER_DAYS
                  }
                  status={c.status}
                />
              ))
            )
          ) : myCommitment ? (
            <TesterProgressRow
              name="You"
              optedInAt={myCommitment.opted_in_at}
              durationDays={
                myCommitment.duration_days ??
                row.duration_days ??
                TESTER_DAYS
              }
              status={myCommitment.status}
            />
          ) : (
            <p className="text-[13px] text-ink/55">
              Join to start your own {row.duration_days ?? TESTER_DAYS}-day
              clock. Later testers do not share this one.
            </p>
          )}
        </section>
      ) : null}

      {isOwner && chipInsights.length > 0 ? (
        <AnswerInsights insights={chipInsights} />
      ) : null}

      {isOwner && (row.type === "feedback" || row.type === "combo") ? (
        <OwnerReviews requestId={row.id} />
      ) : null}
    </div>
  );
}

async function OwnerReviews({ requestId }: { requestId: string }) {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, confirm_status, created_at, reviewer_id")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });

  if (!reviews?.length) return null;

  const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
  const { data: reviewers } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", reviewerIds);
  const names = new Map((reviewers ?? []).map((r) => [r.id, r.display_name]));

  return (
    <section className="mt-10 space-y-3">
      <h2 className="font-display text-[24px] font-semibold">Reviews</h2>
      {reviews.map((review) => (
        <Link
          key={review.id}
          href={`/reviews/${review.id}/confirm`}
          className="flex items-center justify-between border-b border-border py-3 hover:bg-mist/60"
        >
          <span>{names.get(review.reviewer_id) ?? "Reviewer"}</span>
          <span className="font-mono text-[13px] text-ink/65">
            {review.confirm_status}
          </span>
        </Link>
      ))}
    </section>
  );
}
