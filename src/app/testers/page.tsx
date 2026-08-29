import Link from "next/link";
import { TesterCommitmentCard } from "@/components/tester-commitment-card";
import { requireProfile } from "@/lib/auth";
import {
  MAX_CONCURRENT_COMMITMENTS,
  MAX_CONCURRENT_COMMITMENTS_PRO,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { CommitmentStatus, RequestRow, TesterCommitment } from "@/lib/types";

type Props = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

const HISTORY_STATUSES: CommitmentStatus[] = [
  "completed",
  "voided",
  "cancelled",
];

function isHistoryStatus(status: CommitmentStatus) {
  return HISTORY_STATUSES.includes(status);
}

export default async function TestersPage({ searchParams }: Props) {
  const profile = await requireProfile();
  const query = await searchParams;

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

  const activeRows = rows.filter((c) => c.status === "active");
  const historyRows = rows.filter((c) => isHistoryStatus(c.status));

  const maxSlots = profile.is_pro
    ? MAX_CONCURRENT_COMMITMENTS_PRO
    : MAX_CONCURRENT_COMMITMENTS;
  const activeCount = activeRows.length;

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <p className="eyebrow">Your commitments</p>
      <h1 className="mt-2 font-display text-[34px] font-semibold leading-tight">
        My tests
      </h1>
      <p className="mt-2 font-mono text-[13px] text-ink/65">
        {activeCount} / {maxSlots} active
        {profile.is_pro ? " · Pro" : " · 1 at a time · Pro is 3"}
      </p>

      {query.error ? (
        <p className="mt-4 text-[13px] text-flag">{query.error}</p>
      ) : null}
      {query.message ? (
        <p className="mt-4 text-[13px] text-ink/80">{query.message}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/board?type=tester" className="btn btn-primary">
          Find tester requests
        </Link>
        {historyRows.length > 0 ? (
          <a href="#history" className="filter-chip">
            Jump to history
          </a>
        ) : null}
      </div>

      <section className="mt-10 space-y-4">
        <div>
          <p className="eyebrow">Active</p>
          <h2 className="mt-2 font-display text-[24px] font-semibold">
            In progress
          </h2>
          <p className="mt-1 text-[13px] text-ink/60">
            Check in every other day until your run completes.
          </p>
        </div>

        {activeRows.length === 0 ? (
          <p className="well px-4 py-5 text-[14px] text-ink/65">
            No active tests. Join a closed test from the board, opt in with your
            device, and check in every other day.
          </p>
        ) : (
          <div className="space-y-4">
            {activeRows.map((commitment) => (
              <TesterCommitmentCard
                key={commitment.id}
                commitment={commitment}
                request={requestMap.get(commitment.request_id)}
                variant="active"
                showCheckinForm={Boolean(query.error)}
              />
            ))}
          </div>
        )}
      </section>

      <section id="history" className="mt-12 space-y-4">
        <div>
          <p className="eyebrow">History</p>
          <h2 className="mt-2 font-display text-[24px] font-semibold">
            Past tests
          </h2>
          <p className="mt-1 text-[13px] text-ink/60">
            Finished, voided, or cancelled runs. Open a row to see your progress
            on the request page — owners see full analytics on posts they run.
          </p>
        </div>

        {historyRows.length === 0 ? (
          <p className="well px-4 py-5 text-[14px] text-ink/55">
            Completed tests will show up here with your check-in record.
          </p>
        ) : (
          <div className="space-y-3">
            {historyRows.map((commitment) => (
              <TesterCommitmentCard
                key={commitment.id}
                commitment={commitment}
                request={requestMap.get(commitment.request_id)}
                variant="history"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
