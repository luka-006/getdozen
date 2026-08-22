import {
  completeTesterCommitment,
  submitCheckin,
  voidStaleCommitments,
} from "@/actions/testers";
import { DayStrip, StatusChip } from "@/components/day-strip";
import { requireProfile } from "@/lib/auth";
import {
  MAX_CONCURRENT_COMMITMENTS,
  MAX_CONCURRENT_COMMITMENTS_PRO,
  TESTER_DAYS,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { testerCubes, testerJoinedLabel } from "@/lib/tester-progress";
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
      <h1 className="font-display text-[32px] font-semibold">My tests</h1>
      <p className="mt-1 font-mono text-[13px] text-ink/65">
        {activeCount} / {maxSlots}
        {profile.is_pro ? " · Pro" : ""}
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
            No commitments yet. Join a closed test from the board, opt in with
            your device, and check in every other day.
          </p>
        ) : (
          rows.map((commitment) => {
            const request = requestMap.get(commitment.request_id);
            const canComplete =
              commitment.status === "active" &&
              new Date(commitment.completes_at) <= new Date();
            const cubes = testerCubes({
              durationDays:
                commitment.duration_days ??
                request?.duration_days ??
                TESTER_DAYS,
              optedInAt: commitment.opted_in_at,
              status: commitment.status,
            });

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
                    <p className="mt-1 text-[13px] text-ink/60">
                      {testerJoinedLabel(commitment.opted_in_at)} · completes{" "}
                      <span className="font-mono">
                        {new Date(commitment.completes_at).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip status={commitment.status} />
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
                </div>

                <DayStrip
                  total={cubes.total}
                  filled={cubes.filled}
                  label={cubes.label}
                />

                {commitment.status === "active" ? (
                  <details className="tester-fold" open={Boolean(query.error)}>
                    <summary>Check in</summary>
                    <form action={submitCheckin} className="tester-fold-body">
                      <input
                        type="hidden"
                        name="commitment_id"
                        value={commitment.id}
                      />
                      <div className="field">
                        <label htmlFor={`checkin-${commitment.id}`}>
                          What did you see in the app today?
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
                  </details>
                ) : null}

                {canComplete ? (
                  <details className="tester-fold" open>
                    <summary>Finish test</summary>
                    <form
                      action={completeTesterCommitment}
                      className="tester-fold-body"
                    >
                      <input
                        type="hidden"
                        name="commitment_id"
                        value={commitment.id}
                      />
                      <div className="field">
                        <label htmlFor={`final-${commitment.id}`}>
                          Day {cubes.total} structured review
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
                  </details>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
