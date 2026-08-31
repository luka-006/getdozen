import {
  openBillingPortal,
  purchaseDotPack,
  startProSubscription,
} from "@/actions/billing";
import { CustomDotsBuy } from "@/components/custom-dots-buy";
import { currencyName } from "@/lib/currency";
import { PRO_BENEFITS } from "@/lib/constants";
import { DOT_PACKS, PRO_PRICE_EUR } from "@/lib/pricing";

type Props = {
  isPro: boolean;
  purchaseErrors: Record<string, string | null>;
};

export function BuyDotsSection({ isPro, purchaseErrors }: Props) {
  const customBlocked = Object.values(purchaseErrors).some(Boolean);

  return (
    <section className="mt-10 space-y-8">
      <div>
        <h2 className="font-display text-[24px] font-semibold">Buy {currencyName().toLowerCase()}</h2>

        <div className="mt-4 space-y-3">
          {DOT_PACKS.map((pack) => {
            const blocked = purchaseErrors[pack.id];
            const list = pack.dots * 1;
            const save = list - pack.amountEur;
            return (
              <div
                key={pack.id}
                className="surface flex flex-wrap items-center justify-between gap-4 px-5 py-5"
              >
                <div className="min-w-0">
                  <p className="font-display text-[18px] font-semibold">
                    {pack.label}
                  </p>
                  {save > 0 ? (
                    <p className="mt-1 inline-flex rounded-[6px] bg-credit px-1.5 py-0.5 font-mono text-[12px] text-ink">
                      Save €{save}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <p className="font-display text-[32px] font-semibold tracking-tight">
                    €{pack.amountEur}
                  </p>
                  <form action={purchaseDotPack}>
                    <input type="hidden" name="pack_id" value={pack.id} />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={Boolean(blocked)}
                      title={blocked ?? undefined}
                    >
                      Buy
                    </button>
                  </form>
                </div>
              </div>
            );
          })}

          <CustomDotsBuy blocked={customBlocked} />
        </div>
        {customBlocked ? (
          <p className="mt-3 text-[13px] text-ink/55">
            One confirmed review before buying.
          </p>
        ) : null}
      </div>

      <div>
        <h2 className="font-display text-[24px] font-semibold">Pro</h2>
        <div className="surface mt-4 px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-[32px] font-semibold tracking-tight">
                €{PRO_PRICE_EUR}
                <span className="ml-1 font-sans text-[15px] font-normal text-ink/55">
                  /mo
                </span>
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-ink/70">
                {PRO_BENEFITS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
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
      </div>
    </section>
  );
}
