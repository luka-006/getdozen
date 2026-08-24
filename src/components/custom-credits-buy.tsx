"use client";

import { useState } from "react";
import { purchaseCreditsAmount } from "@/actions/billing";
import { EUR_PER_CREDIT, eurForCredits } from "@/lib/pricing";

type Props = {
  returnTo?: string;
  blocked?: boolean;
};

export function CustomCreditsBuy({ returnTo = "/wallet", blocked = false }: Props) {
  const [credits, setCredits] = useState(10);
  const valid = Number.isInteger(credits) && credits >= 1 && credits <= 500;
  const amount = valid ? eurForCredits(credits) : EUR_PER_CREDIT;

  return (
    <div
      id="custom"
      className="surface flex flex-wrap items-center justify-between gap-4 px-5 py-5"
    >
      <div className="min-w-0">
        <p className="font-display text-[18px] font-semibold">Custom</p>
        <p className="mt-1 text-[13px] text-ink/60">
          Any amount · €{EUR_PER_CREDIT} each · 1–500
        </p>
      </div>
      <form
        action={purchaseCreditsAmount}
        className="flex flex-wrap items-center gap-3"
      >
        <input type="hidden" name="return_to" value={returnTo} />
        <input
          type="number"
          name="credits"
          min={1}
          max={500}
          value={credits}
          onChange={(e) => setCredits(Number(e.target.value))}
          className="input font-mono w-24"
          aria-label="Custom credit amount"
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
