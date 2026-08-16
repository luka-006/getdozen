"use client";

import { useEffect, useRef, useState } from "react";

const TOTAL_DAYS = 14;
const TOTAL_TESTERS = 12;
const FILL_MS = 160;
const FILL_MS_REDUCED = 70;
const CELEBRATE_MS = 1600;

type Phase = "idle" | "filling" | "celebrate" | "done";

export function HeroClosedTest() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [filled, setFilled] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const start = () => {
      setPhase((current) => (current === "idle" ? "filling" : current));
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          start();
          io.disconnect();
        }
      },
      { threshold: 0.35, rootMargin: "40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (phase === "idle" || phase === "done") return;

    if (phase === "filling") {
      if (filled >= TOTAL_DAYS) {
        setPhase("celebrate");
        return;
      }
      const step = reduceMotion ? FILL_MS_REDUCED : FILL_MS;
      const t = window.setTimeout(() => setFilled((n) => n + 1), step);
      return () => window.clearTimeout(t);
    }

    const t = window.setTimeout(() => setPhase("done"), CELEBRATE_MS);
    return () => window.clearTimeout(t);
  }, [filled, phase, reduceMotion]);

  const testers = Math.min(
    TOTAL_TESTERS,
    Math.round((filled / TOTAL_DAYS) * TOTAL_TESTERS),
  );
  const dayLabel =
    phase === "celebrate" || phase === "done"
      ? "14 of 14 — done"
      : `${filled} of ${TOTAL_DAYS} days`;
  const celebrating = phase === "celebrate";

  return (
    <div
      ref={rootRef}
      className={`surface w-full max-w-md space-y-5 p-5 sm:p-6 ${
        celebrating ? "hero-test-celebrate" : ""
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-[18px] font-semibold">Closed test</p>
        <p className="font-mono text-[13px] text-ink/60">{dayLabel}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          className="grid grid-cols-7 gap-1.5 sm:flex sm:gap-1"
          role="img"
          aria-label={dayLabel}
        >
          {Array.from({ length: TOTAL_DAYS }, (_, i) => {
            const on = i < filled;
            const justFilled = phase === "filling" && on && i === filled - 1;
            return (
              <span
                key={i}
                className={`hero-day-cube inline-block h-3 w-3 rounded-[2px] sm:h-2.5 sm:w-2.5 ${
                  on
                    ? `bg-blue${celebrating ? " hero-day-cube-lit" : ""}${
                        justFilled ? " hero-day-cube-pop" : ""
                      }`
                    : "border border-border bg-mist"
                }`}
                style={
                  celebrating
                    ? { animationDelay: `${i * 35}ms` }
                    : undefined
                }
              />
            );
          })}
        </div>
        <span className="font-mono text-[13px] text-ink/80">{dayLabel}</span>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex justify-between text-[13px]">
          <span className="text-ink/60">Testers in</span>
          <span
            className={`font-mono ${
              celebrating ? "text-blue font-medium" : ""
            }`}
          >
            {celebrating || phase === "done"
              ? `${TOTAL_TESTERS} / ${TOTAL_TESTERS}`
              : `${testers} / ${TOTAL_TESTERS}`}
          </span>
        </div>
      </div>
    </div>
  );
}
