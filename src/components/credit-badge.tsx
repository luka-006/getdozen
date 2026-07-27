"use client";

import { useEffect, useRef, useState } from "react";
import { formatCredits } from "@/lib/utils";

type Props = {
  value: number;
  pending?: number;
  pulseKey?: string | number;
};

export function CreditBadge({ value, pending = 0, pulseKey }: Props) {
  const [display, setDisplay] = useState(value);
  const [pulse, setPulse] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    const from = prev.current;
    const to = value;
    prev.current = value;
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
      className={`inline-flex items-center gap-2 rounded-[6px] border border-border bg-credit px-2.5 py-1 text-ink ${pulse ? "credit-pulse" : ""}`}
      aria-live="polite"
    >
      <span className="font-mono text-[13px] font-medium">
        {formatCredits(Number(display.toFixed(1)))}
      </span>
      <span className="text-[13px]">credits</span>
      {pending > 0 ? (
        <span className="font-mono text-[12px] text-ink/70">
          +{formatCredits(pending)} pending
        </span>
      ) : null}
    </div>
  );
}
