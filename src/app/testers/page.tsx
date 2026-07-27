import {
  completeTesterCommitment,
  submitCheckin,
  voidStaleCommitments,
} from "@/actions/testers";
import { DayStrip } from "@/components/day-strip";
import { requireProfile } from "@/lib/auth";
import {
  MAX_CONCURRENT_COMMITMENTS,
  MAX_CONCURRENT_COMMITMENTS_PRO,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { RequestRow, TesterCommitment } from "@/lib/types";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function TestersPage({ searchParams }: Props) {
  const profile = await requireProfile();
  const query = await searchParams;
  await voidStaleCommitments();

  const supabase = await createClient();
  const { data: commitments } = await supabase
    .from("tester_commitments")
    .select("*")
    .eq("tester_id", profile.id)
    .order("created_at", { ascending: false });

  const rows = (commitments ?? []) as TesterCommitment[];
  const requestIds = [...new Set(rows.map((c) => c.request_id))];
  const { data: requests } = requestIds.length
    ? await supabase.from("requests").select("*").in("id", requestIds)
    : { data: [] as RequestRow[] };
  const requestMap = new Map(((requests ?? []) as RequestRow[]).map((r) => [r.id, r]));

  const maxSlots = profile.is_pro
    ? MAX_CONCURRENT_COMMITMENTS_PRO
    : MAX_CONCURRENT_COMMITMENTS;
  const activeCount = rows.filter((c) => c.status === "active").length;

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <h1 className="font-display text-[32px] font-semibold">Tester dashboard</h1>
      <p className="mt-1 text-ink/70">
        Active commitments:{" "}
        <span className="font-mono">
          {activeCount} / {maxSlots}
        </span>
        {profile.is_pro ? " (Pro)" : ""}
      </p>

      {query.error ? (
        <p className="mt-4 text-[13px] text-flag">{query.error}</p>
      ) : null}
      {query.message ? (
        <p className="mt-4 text-[13px] text-ink/80">{query.message}</p>
      ) : null}

      <div className="mt-6">
        <Link href="/board?type=tester" className="btn btn-secondary">
          Find tester requests
        </Link>
      </div>

      <div className="mt-8 space-y-6">
        {rows.length === 0 ? (
          <p className="text-ink/65">
            No commitments yet. Join a closed test from the board, opt in with a
            real device, and check in every other day.
          </p>
        ) : (
          rows.map((commitment) => {
            const request = requestMap.get(commitment.request_id);
            const canComplete =
              commitment.status === "active" &&
              new Date(commitment.completes_at) <= new Date();

            return (
              <article
                key={commitment.id}
                className="space-y-3 border-b border-border pb-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-[18px] font-semibold">
                      {request?.app_name ?? "App"}
                    </h2>
                    <p className="text-[13px] text-ink/60">
                      Status: {commitment.status} · completes{" "}
                      <span className="font-mono">
                        {new Date(commitment.completes_at).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                  {request?.opt_in_link ? (
                    <a
                      href={request.opt_in_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] text-blue"
                    >
                      Opt-in link
                    </a>
                  ) : null}
                </div>

                <DayStrip
                  days={commitment.checkin_days ?? []}
                  label={`${commitment.checkins_completed} of 14 days`}
                />

                {commitment.status === "active" ? (
                  <form action={submitCheckin} className="space-y-3">
                    <input type="hidden" name="commitment_id" value={commitment.id} />
                    <div className="field">
                      <label htmlFor={`checkin-${commitment.id}`}>
                        Check-in: what did you see in the app today?
                      </label>
                      <textarea
                        id={`checkin-${commitment.id}`}
                        name="prompt_answer"
                        className="textarea"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Save check-in
                    </button>
                  </form>
                ) : null}

                {canComplete ? (
                  <form action={completeTesterCommitment} className="space-y-3">
                    <input type="hidden" name="commitment_id" value={commitment.id} />
                    <div className="field">
                      <label htmlFor={`final-${commitment.id}`}>
                        Day 14 structured review
                      </label>
                      <textarea
                        id={`final-${commitment.id}`}
                        name="final_notes"
                        className="textarea"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Complete commitment
                    </button>
                  </form>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
