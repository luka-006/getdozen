import Link from "next/link";
import { CustomDotsBuy } from "@/components/custom-dots-buy";
import { getProfile } from "@/lib/auth";
import { canPurchaseDots } from "@/lib/credits";
import {
  COMBO_PACKS,
  MIN_TESTERS,
  PRO_BENEFITS,
  TESTER_COST,
} from "@/lib/constants";
import { currencyName, formatDots } from "@/lib/currency";
import { DOT_PACKS, EUR_PER_DOT, PRO_PRICE_EUR } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pricing",
  description:
    `Dot packs, custom amounts, and Pro on Dozen. Buy ${currencyName()} to post tester and feedback requests.`,
  path: "/pricing",
});

export default async function PricingPage() {
  const profile = await getProfile();
  const customBlocked = profile
    ? !canPurchaseDots(profile, 1).ok
    : false;

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <h1 className="font-display text-[32px] font-semibold">Pricing</h1>
      <p className="mt-1 text-[14px] text-ink/65">
        Base rate €{EUR_PER_DOT} / Dot. Bigger packs cost less.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-[22px] font-semibold">How posting works</h2>
        <ul className="list-disc space-y-1 pl-5 text-[14px] text-ink/70">
          <li>Feedback: 1 Dot per question. 12 questions = 12 Dots.</li>
          <li>
            Testers: {TESTER_COST} Dots per tester, minimum {MIN_TESTERS}.
          </li>
          <li>Combo packs keep the prices below — cheaper than buying both.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-[22px] font-semibold">{currencyName()}</h2>
        <div className="space-y-3">
          {DOT_PACKS.map((pack) => {
            const list = pack.dots * EUR_PER_DOT;
            const save = list - pack.amountEur;
            return (
              <div
                key={pack.id}
                className="surface flex flex-wrap items-center justify-between gap-4 px-5 py-5"
              >
                <div>
                  <p className="font-display text-[20px] font-semibold">
                    {pack.label}
                  </p>
                  {save > 0 ? (
                    <p className="mt-1 inline-flex rounded-[6px] bg-credit px-1.5 py-0.5 font-mono text-[12px] text-ink">
                      Save €{save}
                    </p>
                  ) : (
                    <p className="mt-1 text-[13px] text-ink/55">
                      €{EUR_PER_DOT} each
                    </p>
                  )}
                </div>
                <p className="font-display text-[36px] font-semibold tracking-tight text-ink">
                  €{pack.amountEur}
                </p>
              </div>
            );
          })}
          {profile ? (
            <CustomDotsBuy
              returnTo="/pricing"
              blocked={customBlocked}
            />
          ) : (
            <div className="surface flex flex-wrap items-center justify-between gap-4 px-5 py-5">
              <div>
                <p className="font-display text-[20px] font-semibold">Custom</p>
                <p className="mt-1 text-[13px] text-ink/55">
                  Any amount · €{EUR_PER_DOT} each
                </p>
              </div>
              <Link href="/login" className="btn btn-primary">
                Sign in to buy
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-[22px] font-semibold">Combo packs</h2>
        <div className="space-y-3">
          {COMBO_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="surface flex flex-wrap items-center justify-between gap-4 px-5 py-5"
            >
              <p className="font-display text-[18px] font-semibold">
                {pack.label}
              </p>
              <p className="font-display text-[28px] font-semibold tracking-tight">
                {formatDots(pack.credits)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[22px] font-semibold">Pro</h2>
        <div className="surface mt-3 px-5 py-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-[20px] font-semibold">Monthly</p>
              <p className="mt-1 text-[14px] text-ink/65">What Pro includes</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-[14px] text-ink/70">
                {PRO_BENEFITS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <p className="font-display text-[36px] font-semibold tracking-tight">
              €{PRO_PRICE_EUR}
              <span className="ml-1 font-sans text-[16px] font-normal text-ink/55">
                /mo
              </span>
            </p>
          </div>
        </div>
      </section>

      <p className="mt-10 text-[13px] text-ink/65">
        <Link href="/signup" className="text-blue">
          Create account
        </Link>
        {" · "}
        <Link href="/wallet" className="text-blue">
          Wallet
        </Link>
        {" · "}
        <Link href="/terms/payment" className="text-blue">
          Payment terms
        </Link>
      </p>
    </div>
  );
}
