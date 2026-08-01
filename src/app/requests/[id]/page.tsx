import Link from "next/link";
import { notFound } from "next/navigation";
import { joinTesterRequest } from "@/actions/testers";
import { DayStrip } from "@/components/day-strip";
import { PackProgress } from "@/components/pack-progress";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/crypto";
import { formatCredits, formatWait } from "@/lib/utils";
import type { RequestRow, TesterCommitment } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

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
  if (isOwner && (row.type === "tester" || row.type === "combo")) {
    const { data } = await supabase
      .from("tester_commitments")
      .select("*")
      .eq("request_id", id)
      .order("created_at");
    commitments = (data ?? []) as TesterCommitment[];
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

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <p className="text-[13px] text-ink/55">
        <Link href="/board" className="text-blue">
          Board
        </Link>{" "}
        / request
      </p>
      <h1 className="mt-2 font-display text-[32px] font-semibold">{row.app_name}</h1>
      <p className="mt-2 text-ink/75">{row.app_description}</p>

      {query.error ? (
        <p className="mt-4 text-[13px] text-flag">{query.error}</p>
      ) : null}

      <dl className="mt-6 grid gap-3 text-[15px]">
        <div className="flex justify-between gap-4 border-b border-border py-2">
          <dt className="text-ink/60">Posted by</dt>
          <dd>
            <Link href={`/profile/${owner?.id}`} className="text-blue">
              {owner?.display_name}
            </Link>
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border py-2">
          <dt className="text-ink/60">App</dt>
          <dd className="text-ink/70 truncate max-w-[60%]">{row.app_url}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border py-2">
          <dt className="text-ink/60">Waiting</dt>
          <dd className="font-mono">{formatWait(row.created_at)}</dd>
        </div>
        {row.type === "feedback" ? (
          <>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-ink/60">Questions</dt>
              <dd className="font-mono">{row.question_count}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-ink/60">Credit cost / earn</dt>
              <dd>
                <span className="rounded-[6px] bg-credit px-1.5 py-0.5 font-mono">
                  {formatCredits(Number(row.credit_cost) * Number(row.bounty_multiplier))}
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
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-ink/60">Testers</dt>
              <dd className="font-mono">
                {row.testers_filled} / {row.testers_needed}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-ink/60">Questions</dt>
              <dd className="font-mono">{row.question_count}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-ink/60">Pack cost</dt>
              <dd>
                <span className="rounded-[6px] bg-credit px-1.5 py-0.5 font-mono">
                  {formatCredits(Number(row.credit_cost))}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-ink/60">Focus</dt>
              <dd>{row.test_focus}</dd>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-ink/60">Testers</dt>
              <dd className="font-mono">
                {row.testers_filled} / {row.testers_needed}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
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
      row.status === "open" ? (
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

      {isOwner && (row.type === "tester" || row.type === "combo") ? (
        <section className="mt-10 space-y-4">
          <h2 className="font-display text-[24px] font-semibold">Tester progress</h2>
          {commitments.length === 0 ? (
            <p className="text-ink/65">No testers yet.</p>
          ) : (
            commitments.map((c) => (
              <div key={c.id} className="border-b border-border py-3">
                <p className="text-[13px] text-ink/60">{c.status}</p>
                <DayStrip days={c.checkin_days ?? []} />
              </div>
            ))
          )}
        </section>
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
