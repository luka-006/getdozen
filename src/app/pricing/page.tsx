import Link from "next/link";
import { CREDIT_PACKS, EUR_PER_CREDIT, PRO_PRICE_EUR } from "@/lib/pricing";

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <h1 className="font-display text-[32px] font-semibold">Pricing</h1>
      <p className="mt-1 text-[14px] text-ink/65">
        Base rate €{EUR_PER_CREDIT} / credit. Bigger packs cost less.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-[22px] font-semibold">Credits</h2>
        <div className="space-y-3">
          {CREDIT_PACKS.map((pack) => {
            const list = pack.credits * EUR_PER_CREDIT;
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
                      €{EUR_PER_CREDIT} each
                    </p>
                  )}
                </div>
                <p className="font-display text-[36px] font-semibold tracking-tight text-ink">
                  €{pack.amountEur}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[22px] font-semibold">Pro</h2>
        <div className="surface mt-3 px-5 py-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-[20px] font-semibold">Monthly</p>
              <p className="mt-1 text-[14px] text-ink/65">
                5 tester slots · board boost · 48h review guarantee
              </p>
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

      <p className="mt-10 text-[13px]">
        <Link href="/signup" className="text-blue">
          Create account
        </Link>
      </p>
    </div>
  );
}
