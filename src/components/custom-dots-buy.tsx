"use client";

import { useState } from "react";
import { purchaseDotsAmount } from "@/actions/billing";
import { currencyUnits } from "@/lib/currency";
import { EUR_PER_DOT, eurForDots } from "@/lib/pricing";

type Props = {
  returnTo?: string;
  blocked?: boolean;
};

export function CustomDotsBuy({ returnTo = "/wallet", blocked = false }: Props) {
  const [dots, setDots] = useState(10);
  const valid = Number.isInteger(dots) && dots >= 1 && dots <= 500;
  const amount = valid ? eurForDots(dots) : EUR_PER_DOT;

  return (
    <div
      id="custom"
      className="surface flex flex-wrap items-center justify-between gap-4 px-5 py-5"
    >
      <div className="min-w-0">
        <p className="font-display text-[18px] font-semibold">Custom</p>
        <p className="mt-1 text-[13px] text-ink/60">
          Any amount · €{EUR_PER_DOT} per {currencyUnits(1)} · 1–500
        </p>
      </div>
      <form
        action={purchaseDotsAmount}
        className="flex flex-wrap items-center gap-3"
      >
        <input type="hidden" name="return_to" value={returnTo} />
        <input
          type="number"
          name="dots"
          min={1}
          max={500}
          value={dots}
          onChange={(e) => setDots(Number(e.target.value))}
          className="input font-mono w-24"
          aria-label={`Custom ${currencyUnits(2)} amount`}
        />
        <p className="font-display text-[24px] font-semibold tracking-tight">
          €{amount}
        </p>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={blocked || !valid}
          title={blocked ? "One confirmed review before buying." : undefined}
        >
          Buy
        </button>
      </form>
    </div>
  );
}
