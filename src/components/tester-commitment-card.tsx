import Link from "next/link";
import {
  completeTesterCommitment,
  submitCheckin,
} from "@/actions/testers";
import { DayStrip, StatusChip } from "@/components/day-strip";
import {
  CHECKIN_INTERVAL_DAYS,
  TESTER_DAYS,
} from "@/lib/constants";
import {
  testerCheckinEarnAmount,
  testerCompletionEarnAmount,
} from "@/lib/tester-checkin";
import { testerCubes, testerJoinedLabel } from "@/lib/tester-progress";
import type { RequestRow, TesterCommitment } from "@/lib/types";

type Props = {
  commitment: TesterCommitment;
  request: RequestRow | undefined;
  variant: "active" | "history";
  showCheckinForm?: boolean;
  checkinQuestion?: string;
};

function historyEndedLabel(commitment: TesterCommitment) {
  const end = new Date(commitment.completes_at);
  if (!Number.isFinite(end.getTime())) return null;
  const prefix =
    commitment.status === "completed"
      ? "Finished"
      : commitment.status === "voided"
        ? "Voided"
        : commitment.status === "cancelled"
          ? "Cancelled"
          : "Ended";
  return `${prefix} ${end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

export function TesterCommitmentCard({
  commitment,
  request,
  variant,
  showCheckinForm = false,
  checkinQuestion,
}: Props) {
  const isHistory = variant === "history";
  const durationDays =
    commitment.duration_days ?? request?.duration_days ?? TESTER_DAYS;
  const cubes = testerCubes({
    durationDays,
    optedInAt: commitment.opted_in_at,
    status: commitment.status,
  });
  const canComplete =
    !isHistory &&
    commitment.status === "active" &&
    new Date(commitment.completes_at) <= new Date();
  const appName = request?.app_name ?? "App";
  const requestHref = `/requests/${commitment.request_id}`;

  if (isHistory) {
    return (
      <Link href={requestHref} className="tester-history-card surface block p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink/40">
              Past test
            </p>
            <h2 className="mt-1 font-display text-[18px] font-semibold text-ink/70">
              {appName}
            </h2>
            <p className="mt-1 text-[13px] text-ink/50">
              {testerJoinedLabel(commitment.opted_in_at)}
              {historyEndedLabel(commitment)
                ? ` · ${historyEndedLabel(commitment)}`
                : null}
            </p>
          </div>
          <StatusChip status={commitment.status} />
        </div>

        <div className="mt-4">
          <DayStrip
            total={cubes.total}
            filled={cubes.filled}
            label={cubes.label}
            muted
          />
        </div>

        <dl className="stat-grid mt-4">
          <div className="stat-cell">
            <dt className="text-ink/45">Check-ins</dt>
            <dd className="font-mono text-ink/60">
              {commitment.checkins_completed}
            </dd>
          </div>
          <div className="stat-cell">
            <dt className="text-ink/45">Missed</dt>
            <dd className="font-mono text-ink/60">
              {commitment.checkins_missed}
            </dd>
          </div>
          <div className="stat-cell">
            <dt className="text-ink/45">Length</dt>
            <dd className="font-mono text-ink/60">{durationDays}d</dd>
          </div>
        </dl>

        <p className="mt-4 text-[13px] text-blue/80">View test details →</p>
      </Link>
    );
  }

  const multiplier = Number(request?.bounty_multiplier ?? 1) || 1;
  const checkinPayout = testerCheckinEarnAmount(multiplier);
  const finishPayout = testerCompletionEarnAmount(multiplier);

  return (
    <article className="surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink/45">
            Active test
          </p>
          <h2 className="mt-1 font-display text-[20px] font-semibold">
            <Link href={requestHref} className="text-blue">
              {appName}
            </Link>
          </h2>
          <p className="mt-1 text-[13px] text-ink/60">
            {testerJoinedLabel(commitment.opted_in_at)} · completes{" "}
            <span className="font-mono">
              {new Date(commitment.completes_at).toLocaleDateString()}
            </span>
            {multiplier > 1 ? (
              <span className="text-blue"> · {multiplier}× priority</span>
            ) : null}
          </p>
          <p className="mt-1 text-[12px] text-ink/50">
            Check-in every {CHECKIN_INTERVAL_DAYS} days (+{checkinPayout} each) ·
            finish +{finishPayout}
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

      <div className="mt-4">
        <DayStrip total={cubes.total} filled={cubes.filled} label={cubes.label} />
      </div>

      {commitment.status === "active" && showCheckinForm ? (
        <details className="tester-fold mt-4" open>
          <summary>Check in (+{checkinPayout})</summary>
          <form action={submitCheckin} className="tester-fold-body">
            <input type="hidden" name="commitment_id" value={commitment.id} />
            <div className="field">
              <label htmlFor={`checkin-${commitment.id}`}>
                {checkinQuestion ?? "What did you see in the app today?"}
              </label>
              <textarea
                id={`checkin-${commitment.id}`}
                name="prompt_answer"
                className="textarea"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Save check-in (+{checkinPayout})
            </button>
          </form>
        </details>
      ) : null}

      {canComplete ? (
        <details className="tester-fold mt-4" open>
          <summary>Finish test</summary>
          <form action={completeTesterCommitment} className="tester-fold-body">
            <input type="hidden" name="commitment_id" value={commitment.id} />
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
              Complete commitment (+{finishPayout})
            </button>
          </form>
        </details>
      ) : null}
    </article>
  );
}
