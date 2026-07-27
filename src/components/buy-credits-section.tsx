"use client";

import {
  openBillingPortal,
  purchaseCreditPack,
  startProSubscription,
} from "@/actions/billing";
import { CREDIT_PACKS } from "@/lib/pricing";

type Props = {
  isPro: boolean;
  purchaseErrors: Record<string, string | null>;
};

export function BuyCreditsSection({ isPro, purchaseErrors }: Props) {
  return (
    <section className="mt-10 space-y-8">
      <div>
        <h2 className="font-display text-[24px] font-semibold">Buy credits</h2>
        <p className="mt-1 text-ink/70">
          After the first 3 purchased credits, you need 1 review given per 2
          credits bought.
        </p>

        <div className="mt-4 space-y-3">
          {CREDIT_PACKS.map((pack) => {
            const blocked = purchaseErrors[pack.id];
            return (
              <div
                key={pack.id}
                className="well flex flex-wrap items-center justify-between gap-3 px-4 py-4"
              >
                <div>
                  <p className="font-medium">{pack.label}</p>
                  <p className="font-mono text-[13px] text-ink/60">
                    €{pack.amountEur}
                  </p>
                  {blocked ? (
                    <p className="mt-1 max-w-md text-[12px] text-ink/55">
                      {blocked}
                    </p>
                  ) : null}
                </div>
                <form action={purchaseCreditPack}>
                  <input type="hidden" name="pack_id" value={pack.id} />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={Boolean(blocked)}
                  >
                    Buy {pack.credits} credits
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="font-display text-[24px] font-semibold">Pro</h2>
        <p className="mt-1 text-ink/70">
          5 concurrent tester slots, board boost, 48-hour review guarantee,
          analytics. €12 / month.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {isPro ? (
            <form action={openBillingPortal}>
              <button type="submit" className="btn btn-secondary">
                Manage billing
              </button>
            </form>
          ) : (
            <form action={startProSubscription}>
              <button type="submit" className="btn btn-primary">
                Start Pro
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
