import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <h1 className="font-display text-[32px] font-semibold">Pricing</h1>
      <p className="mt-1 text-ink/70">
        Earn credits by reviewing and testing, or buy a pack when you need speed.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-[24px] font-semibold">Credits</h2>
        <p className="text-ink/75">
          One credit covers a standard feedback request. Larger question sets cost
          more. Tester slots cost two credits each to fill.
        </p>
        <div className="well px-4 py-4">
          <p className="font-display text-[18px] font-semibold">5 credits</p>
          <p className="mt-1 font-mono text-[15px]">€15</p>
          <p className="mt-2 text-[13px] text-ink/65">
            After the first 3 purchased credits, you need at least 1 review given
            per 2 credits bought.
          </p>
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-[24px] font-semibold">Pro</h2>
        <div className="well px-4 py-4">
          <p className="font-display text-[18px] font-semibold">Pro</p>
          <p className="mt-1 font-mono text-[15px]">€12 / month</p>
          <p className="mt-2 text-[13px] text-ink/65">
            Higher concurrent tester commitments and a Pro mark on the board.
          </p>
        </div>
      </section>

      <p className="mt-10 text-[13px] text-ink/60">
        New accounts start with 1 credit. Checkout arrives once Stripe is connected.{" "}
        <Link href="/signup" className="text-blue">
          Create an account
        </Link>{" "}
        to earn first.
      </p>
    </div>
  );
}
