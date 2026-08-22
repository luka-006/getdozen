import Link from "next/link";
import {
  testerCubes,
  testerJoinedLabel,
  testerStatusLabel,
} from "@/lib/tester-progress";

type Props = {
  total: number;
  filled: number;
  label?: string;
};

export function DayStrip({ total, filled, label }: Props) {
  const safeTotal = Math.max(1, total);
  const safeFilled = Math.min(safeTotal, Math.max(0, filled));
  const text = label ?? `${safeFilled} of ${safeTotal} days`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="grid grid-cols-7 gap-1.5 sm:flex sm:flex-wrap sm:gap-1"
        role="img"
        aria-label={text}
      >
        {Array.from({ length: safeTotal }, (_, i) => {
          const on = i < safeFilled;
          return (
            <span
              key={i}
              className={`inline-block h-3 w-3 rounded-[2px] sm:h-2.5 sm:w-2.5 ${
                on ? "bg-blue" : "border border-border bg-mist"
              }`}
            />
          );
        })}
      </div>
      <span className="font-mono text-[13px] text-ink/80">{text}</span>
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "text-blue border-blue/25 bg-blue/5"
      : status === "completed"
        ? "text-ink/70 border-border bg-mist"
        : status === "voided" || status === "cancelled"
          ? "text-flag border-flag/25 bg-flag/5"
          : "text-ink/60 border-border";

  return (
    <span
      className={`inline-flex rounded-[6px] border px-1.5 py-0.5 text-[12px] font-medium ${tone}`}
    >
      {testerStatusLabel(status)}
    </span>
  );
}

export function TesterProgressRow({
  name,
  href,
  optedInAt,
  durationDays,
  status,
}: {
  name: string;
  href?: string;
  optedInAt: string;
  durationDays: unknown;
  status: string;
}) {
  const cubes = testerCubes({
    durationDays,
    optedInAt,
    status,
  });
  const title = name.trim() || "Tester";

  return (
    <div className="space-y-2 border-b border-border py-3 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {href ? (
          <Link href={href} className="font-medium text-blue">
            {title}
          </Link>
        ) : (
          <p className="font-medium">{title}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[12px] text-ink/55">
            {testerJoinedLabel(optedInAt)}
          </span>
          <StatusChip status={status} />
        </div>
      </div>
      <DayStrip
        total={cubes.total}
        filled={cubes.filled}
        label={cubes.label}
      />
    </div>
  );
}
