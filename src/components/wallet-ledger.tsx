import { formatDots, formatDotsDelta } from "@/lib/currency";
import { ledgerRowMeta } from "@/lib/ledger-labels";
import type { CreditLedgerEntry } from "@/lib/types";

type Props = {
  entries: CreditLedgerEntry[];
};

function formatAmount(amount: number): string {
  if (amount > 0) return formatDotsDelta(amount);
  if (amount < 0) return `−${formatDots(Math.abs(amount))}`;
  return formatDots(0);
}

export function WalletLedger({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <section className="mt-10">
        <h2 className="font-display text-[24px] font-semibold">Activity</h2>
        <p className="mt-4 text-[14px] text-ink/60">
          Reviews, purchases, and posts will show up here.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-[24px] font-semibold">Activity</h2>
      <ul className="mt-4 divide-y divide-border rounded-[var(--radius-app)] border border-border bg-paper">
        {entries.map((entry) => {
          const { label, when, hint } = ledgerRowMeta(entry);
          const positive = entry.amount > 0;
          const negative = entry.amount < 0;

          return (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-4 px-4 py-3.5 first:rounded-t-[var(--radius-app)] last:rounded-b-[var(--radius-app)]"
            >
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium">{label}</p>
                <p className="mt-0.5 text-[13px] text-ink/55">
                  {when}
                  {hint ? (
                    <>
                      {" · "}
                      <span
                        className={
                          entry.status === "pending" ? "text-ink/70" : ""
                        }
                      >
                        {hint}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-[6px] px-2 py-0.5 font-mono text-[13px] tabular-nums ${
                  positive
                    ? "bg-credit text-ink"
                    : negative
                      ? "text-flag"
                      : "text-ink/55"
                }`}
              >
                {formatAmount(Number(entry.amount))}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
