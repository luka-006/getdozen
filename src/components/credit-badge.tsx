"use client";

import { useEffect, useRef, useState } from "react";
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
      className={`inline-flex items-center gap-1.5 rounded-[6px] border border-border bg-credit px-2.5 py-1 text-ink ${pulse ? "credit-pulse" : ""}`}
      aria-live="polite"
    >
      <svg
        className="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9.5" fill="currentColor" opacity="0.35" />
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 7.5v9M9.2 10.2c.5-1 1.5-1.5 2.8-1.5 1.7 0 2.8.9 2.8 2.1 0 1.1-.8 1.8-2.4 2.2l-1.4.3c-1.3.3-1.9.8-1.9 1.7 0 1 .9 1.7 2.4 1.7 1.2 0 2.1-.5 2.6-1.3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-mono text-[13px] font-medium">
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
