import dynamic from "next/dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DozenMark } from "@/components/dozen-mark";
import { SiteLogo } from "@/components/site-logo";
import { getSessionUser } from "@/lib/auth";
import { isLaunchOpen } from "@/lib/launch";
import { HomeJsonLd } from "@/components/home-json-ld";
import { pageMetadata, SITE_DESCRIPTION, SITE_HOME_TITLE } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ShippedApp } from "@/lib/types";

const HeroClosedTest = dynamic(
  () =>
    import("@/components/hero-closed-test").then((m) => m.HeroClosedTest),
  {
    loading: () => (
      <div className="surface w-full max-w-md min-h-[220px] p-5 sm:p-6" aria-hidden />
    ),
  },
);

const WaitlistForm = dynamic(
  () => import("@/components/waitlist-form").then((m) => m.WaitlistForm),
  {
    loading: () => (
      <div className="surface w-full min-h-[280px] p-5 sm:p-6" aria-hidden />
    ),
  },
);

const WaitlistPhoneShowcase = dynamic(
  () =>
    import("@/components/waitlist-phone-showcase").then(
      (m) => m.WaitlistPhoneShowcase,
    ),
  {
    loading: () => (
      <div className="waitlist-phone-showcase min-h-[320px]" aria-hidden />
    ),
  },
);

export const metadata = pageMetadata({
  title: SITE_HOME_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
  keywords: [
    "app testing marketplace",
    "Google Play closed testing",
    "iOS beta testers",
    "structured app feedback",
    "indie game testing",
    "SaaS user testing",
    "beta tester recruitment",
  ],
});

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ waitlist?: string }>;
}) {
  const [user, query] = await Promise.all([getSessionUser(), searchParams]);
  if (isLaunchOpen() && user) redirect("/board");

  if (!isLaunchOpen()) {
    const notice =
      query.waitlist === "expired"
        ? "That email link was already used. Request a new code."
        : null;

    return (
      <div className="atmosphere">
        <HomeJsonLd />
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center px-4 py-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(300px,520px)_minmax(0,22rem)] lg:items-center lg:gap-8 xl:gap-12">
            <div className="max-w-xl space-y-5 lg:max-w-none">
              <SiteLogo
                markClassName="h-14 w-14 sm:h-16 sm:w-16"
                wordmarkClassName="font-display text-[48px] font-bold leading-none tracking-[-0.03em] text-ink sm:text-[56px]"
                tick
              />
              <h1 className="hero-title mt-3">
                Real feedback on apps and games.
              </h1>
              <p className="hero-lead mt-4">
                Earn by testing other makers&apos; work: mobile apps, web tools,
                and indie games. Post yours and get structured feedback when we
                open.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="pill pill-blue motion-stagger" style={{ animationDelay: "0ms" }}>
                  Structured feedback
                </span>
                <span className="pill motion-stagger" style={{ animationDelay: "80ms" }}>
                  Apps &amp; games
                </span>
                <span className="pill motion-stagger" style={{ animationDelay: "160ms" }}>
                  Tester programs
                </span>
              </div>
              <p className="font-mono text-[13px] text-ink/55">Opening soon</p>
              <p className="text-[13px] text-ink/60">
                <Link href="/blog/why-12-testers" className="text-blue">
                  Why 12 testers
                </Link>
                {" · "}
                <Link href="/blog" className="text-blue">
                  Blog
                </Link>
              </p>
            </div>

            <WaitlistPhoneShowcase />

            <div className="w-full space-y-6 lg:max-w-[22rem]">
              <WaitlistForm notice={notice} />
              <HeroClosedTest />
            </div>
          </div>
        </section>
      </div>
    );
  }

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
      <HomeJsonLd />
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-12 px-4 py-16 lg:flex-row lg:items-center lg:gap-16">
        <div className="max-w-xl space-y-5">
          <SiteLogo
            markClassName="h-14 w-14 sm:h-16 sm:w-16"
            wordmarkClassName="font-display text-[48px] font-bold leading-none tracking-[-0.03em] text-ink sm:text-[56px]"
            tick
          />
          <h1 className="hero-title mt-3">
            Real feedback from real testers.
          </h1>
          <p className="hero-lead mt-4">
            The feedback loop for indie makers: structured reviews, tester
            commitments, and dots that keep quality high.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="pill pill-blue motion-stagger" style={{ animationDelay: "0ms" }}>
              Structured feedback
            </span>
            <span className="pill motion-stagger" style={{ animationDelay: "80ms" }}>
              Tester programs
            </span>
            <span className="pill motion-stagger" style={{ animationDelay: "160ms" }}>
              Dot economy
            </span>
          </div>
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
            <Link href="/guides" className="btn btn-secondary">
              Guides
            </Link>
          </div>
          <p className="text-[13px] text-ink/60">
            <Link href="/blog/google-play-closed-testing-mistakes" className="text-blue">
              Google Play testing
            </Link>
            {" · "}
            <Link href="/blog/app-store-beta-mistakes" className="text-blue">
              iOS beta
            </Link>
            {" · "}
            <Link href="/blog/why-12-testers" className="text-blue">
              Why 12 testers
            </Link>
          </p>
        </div>

        <HeroClosedTest />
      </section>

      {wall.length > 0 ? (
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-[24px] font-semibold">
                Apps that used Dozen
              </h2>
              <Link href="/wall" className="text-[13px] text-blue">
                Wall Of Fame
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
    </div>
  );
}
