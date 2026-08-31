"use client";

import { useEffect, useRef, useState } from "react";
import { CreditIcon } from "@/components/icons";
import { formatCredits } from "@/lib/utils";

type Props = {
  value: number | string;
  pending?: number | string;
  pulseKey?: string | number;
};

function toCreditNumber(raw: number | string | null | undefined) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function CreditBadge({ value, pending = 0, pulseKey }: Props) {
  const amount = toCreditNumber(value);
  const pendingAmount = toCreditNumber(pending);
  const [display, setDisplay] = useState(amount);
  const [pulse, setPulse] = useState(false);
  const prev = useRef(amount);

  useEffect(() => {
    const next = toCreditNumber(value);
    if (next === prev.current) return;
    const from = prev.current;
    const to = next;
    prev.current = next;
    setPulse(true);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(to);
      return;
    }

    const start = performance.now();
    const duration = 450;
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(from + (to - from) * t);
      if (t < 1) frame = requestAnimationFrame(tick);
      else setDisplay(to);
    };

    frame = requestAnimationFrame(tick);
    const timeout = window.setTimeout(() => setPulse(false), 650);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [value, pulseKey]);

  return (
    <div
      className={`inline-flex min-w-[4.75rem] items-center justify-end gap-1.5 rounded-[6px] border border-border bg-credit px-2.5 py-1 text-ink ${pulse ? "credit-pulse" : ""}`}
      aria-live="polite"
    >
      <CreditIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-[1.75rem] text-right font-mono text-[13px] font-medium tabular-nums">
        {formatCredits(display)}
      </span>
      {pendingAmount > 0 ? (
        <span className="font-mono text-[12px] text-ink/70">
          +{formatCredits(pendingAmount)}
        </span>
      ) : null}
    </div>
  );
}
