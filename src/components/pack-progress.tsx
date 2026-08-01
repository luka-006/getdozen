import { differenceInCalendarDays } from "date-fns";
import { formatCredits } from "@/lib/utils";

type Props = {
  hasReview: boolean;
  reviewConfirmed?: boolean;
  testersFilled: number;
  testersNeeded: number;
  expiresAt: string;
  creditCost: number;
};

function Step({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
      <span
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] text-[11px] font-semibold ${
          done ? "bg-blue text-white" : "bg-mist text-ink/45"
        }`}
        aria-hidden
      >
        {done ? "✓" : "·"}
      </span>
      <div>
        <p className="text-[15px] font-medium">{label}</p>
        <p className="mt-0.5 text-[13px] text-ink/60">{detail}</p>
      </div>
    </div>
  );
}

export function PackProgress({
  hasReview,
  reviewConfirmed = false,
  testersFilled,
  testersNeeded,
  expiresAt,
  creditCost,
}: Props) {
  const daysLeft = Math.max(
    0,
    differenceInCalendarDays(new Date(expiresAt), new Date()),
  );
  const testersFull = testersFilled >= testersNeeded;
  const unused = Math.max(0, testersNeeded - testersFilled);
  const potentialRefund = unused * 2;

  return (
    <section className="mt-8">
      <h2 className="font-display text-[24px] font-semibold">Pack progress</h2>
      <p className="mt-1 text-[13px] text-ink/60">
        {formatCredits(creditCost)} credits locked · unused tester slots refund
        at 2 cr each when the pack expires
      </p>
      <div className="mt-4">
        <Step
          done={hasReview}
          label="Feedback review"
          detail={
            !hasReview
              ? "Waiting for a reviewer"
              : reviewConfirmed
                ? "Confirmed"
                : "Submitted — confirm or wait for auto-confirm"
          }
        />
        <Step
          done={testersFull}
          label="Testers"
          detail={`${testersFilled} / ${testersNeeded} filled${
            unused > 0 ? ` · ${unused} open` : ""
          }`}
        />
        <Step
          done={daysLeft === 0 && (hasReview || testersFilled > 0)}
          label="Time left"
          detail={
            daysLeft === 0
              ? potentialRefund > 0
                ? `Expired · ~${potentialRefund} cr unused-slot refund pending`
                : "Expired"
              : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
          }
        />
      </div>
    </section>
  );
}
