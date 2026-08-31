"use client";

import { useMemo, useState } from "react";
import { PRIORITY_OPTIONS } from "@/lib/priority";
import { formatCredits } from "@/lib/utils";

type Props = {
  baseCost: number;
  name?: string;
};

export function PriorityPicker({ baseCost, name = "priority_multiplier" }: Props) {
  const [multiplier, setMultiplier] = useState<number>(1);

  const total = useMemo(
    () => Number((baseCost * multiplier).toFixed(2)),
    [baseCost, multiplier],
  );

  return (
    <div className="field">
      <label htmlFor="priority_multiplier">Priority</label>
      <p className="mb-2 text-[13px] text-ink/60">
        Higher priority pays helpers more and ranks your post higher. Cost scales
        with the multiplier.
      </p>
      <div className="flex flex-wrap gap-2">
        {PRIORITY_OPTIONS.map((opt) => {
          const active = multiplier === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMultiplier(opt.value)}
              className={active ? "filter-chip filter-chip-active" : "filter-chip"}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <input type="hidden" name={name} value={String(multiplier)} />
      <p className="mt-2 font-mono text-[13px] text-ink/70">
        Total: {formatCredits(total)} credits ({PRIORITY_OPTIONS.find((o) => o.value === multiplier)?.hint})
      </p>
    </div>
  );
}
