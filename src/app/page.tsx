import Link from "next/link";
import { redirect } from "next/navigation";
import { DozenMark } from "@/components/dozen-mark";
import { HeroClosedTest } from "@/components/hero-closed-test";
import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ShippedApp } from "@/lib/types";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/board");

  let wall: ShippedApp[] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("shipped_apps")
      .select("*")
      .order("launched_at", { ascending: false })
      .limit(6);
    wall = (data ?? []) as ShippedApp[];
  } catch {
    wall = [];
  }

  return (
    <div className="atmosphere">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-12 px-4 py-16 lg:flex-row lg:items-center lg:gap-16">
        <div className="max-w-xl space-y-5">
          <div className="flex items-center gap-3">
            <DozenMark className="h-14 w-14 sm:h-16 sm:w-16" title="Dozen" tick />
            <p className="font-display text-[48px] font-bold tracking-[0.04em] text-ink sm:text-[56px]">
              Dozen
            </p>
          </div>
          <h1 className="font-display text-[28px] font-semibold text-ink sm:text-[32px]">
            12 real testers. Real answers.
          </h1>
          <p className="trust text-[16px] leading-relaxed">
            Real devices. Real people. No fakes.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/signup?next=/requests/new"
              className="btn btn-primary"
            >
              Post
            </Link>
            <Link href="/signup?next=/board" className="btn btn-secondary">
              Earn
            </Link>
          </div>
        </div>

        <HeroClosedTest />
      </section>

      {wall.length > 0 ? (
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-[24px] font-semibold">
                Apps that used a Dozen
              </h2>
              <Link href="/wall" className="text-[13px] text-blue">
                Wall
              </Link>
            </div>
            <div className="mt-6 border-t border-border">
              {wall.map((app) => (
                <a
                  key={app.id}
                  href={app.app_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-4 border-b border-border py-4 hover:bg-mist/60"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <DozenMark className="h-6 w-6 shrink-0" title="Dozen" />
                    <span className="truncate font-medium">{app.app_name}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[12px] text-ink/50">
                    {new Date(app.launched_at).toLocaleDateString()}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-border bg-mist/60">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Testers", "14-day Play closed tests."],
              ["Feedback", "Structured reviews."],
              ["Bugs", "Paid when marked valid."],
              ["Language", "Native listing checks."],
            ] as const
          ).map(([title, body]) => (
            <div key={title} className="space-y-1">
              <h2 className="font-display text-[18px] font-semibold">{title}</h2>
              <p className="text-[14px] text-ink/70">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
