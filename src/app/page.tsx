import Link from "next/link";
import { redirect } from "next/navigation";
import { DayStrip } from "@/components/day-strip";
import { getSessionUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/board");

  const filled = Array.from({ length: 14 }, (_, i) => i < 7);

  return (
    <div className="relative overflow-hidden">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-10 px-4 py-14 lg:flex-row lg:items-center lg:gap-16">
        <div className="max-w-xl space-y-6">
          <p className="font-display text-[48px] font-bold tracking-[0.04em] text-ink sm:text-[56px]">
            getdozen.app
          </p>
          <h1 className="font-display text-[28px] font-semibold text-ink sm:text-[32px]">
            12 real testers. Structured reviews. One credit currency.
          </h1>
          <p className="text-[17px] text-ink/75">
            Indie makers earn credits by reviewing apps and staying on closed
            tests for 14 days — then spend those credits to get the same help
            back.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-primary">
              Create account
            </Link>
            <Link href="/login" className="btn btn-secondary">
              Sign in
            </Link>
          </div>
          <p className="text-[13px] text-ink/55">
            New accounts start with{" "}
            <span className="rounded-[4px] bg-credit px-1.5 py-0.5 font-mono text-ink">
              1
            </span>{" "}
            credit. English only.
          </p>
        </div>

        <div className="surface w-full max-w-md space-y-5 p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-[18px] font-semibold">Closed test</p>
            <p className="font-mono text-[13px] text-ink/60">day 7 / 14</p>
          </div>
          <DayStrip days={filled} label="7 of 14 days" />
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex justify-between text-[13px]">
              <span className="text-ink/60">Testers opted in</span>
              <span className="font-mono">9 / 12</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-ink/60">Credits to fill remaining</span>
              <span className="rounded-[4px] bg-credit px-1.5 py-0.5 font-mono text-ink">
                6
              </span>
            </div>
          </div>
          <p className="text-[13px] text-ink/55">
            The 14-day strip is the whole point — real check-ins, not a farm.
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-white/70">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <div className="space-y-3">
            <p className="font-mono text-[12px] tracking-wide text-blue uppercase">
              Track A
            </p>
            <h2 className="font-display text-[24px] font-semibold">Feedback</h2>
            <p className="text-ink/75">
              Write a structured review with locked core questions plus a proof
              question. Earn credits when the requester confirms — or after 48
              hours.
            </p>
          </div>
          <div className="space-y-3">
            <p className="font-mono text-[12px] tracking-wide text-blue uppercase">
              Track B
            </p>
            <h2 className="font-display text-[24px] font-semibold">Testers</h2>
            <p className="text-ink/75">
              Join a Play Console closed test for 14 continuous days. Check in
              every other day. Finish and earn 3 credits. Recruit one tester for
              2.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="font-display text-[24px] font-semibold">
            How credits move
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Sign up", "+1"],
              ["Confirm a review", "+1 to +2"],
              ["Finish 14-day test", "+3"],
              ["Recruit 1 tester", "−2"],
            ].map(([label, value]) => (
              <div key={label} className="surface px-4 py-3">
                <p className="text-[13px] text-ink/60">{label}</p>
                <p className="mt-1 font-mono text-[18px]">
                  <span className="rounded-[4px] bg-credit px-1.5 py-0.5 text-ink">
                    {value}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
