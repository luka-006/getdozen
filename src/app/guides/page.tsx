import Link from "next/link";
import { getBlogPosts } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Guides — closed testing, Play Console, App Store, SaaS",
  description:
    "Free guides for indie makers: Google Play closed testing, TestFlight, SaaS launch mistakes, structured feedback, and how to run a 12-tester closed test.",
  path: "/guides",
  keywords: [
    "app testing guide",
    "Google Play closed testing",
    "TestFlight beta guide",
    "SaaS launch checklist",
    "structured app feedback",
    "closed test how-to",
    "indie app launch",
    "beta tester recruitment",
  ],
});

const GUIDE_SECTIONS = [
  {
    id: "closed-testing",
    title: "Closed testing",
    blurb:
      "Duration, check-ins, staffing, and why a dozen committed testers beats two hundred email addresses.",
    posts: [
      { slug: "how-to-run-a-closed-app-test", label: "Run a closed test without losing testers" },
      { slug: "why-12-testers", label: "Why 12 testers is the right number" },
      { slug: "friends-make-bad-beta-testers", label: "Why friends make bad beta testers" },
    ],
    tag: "closed-test",
  },
  {
    id: "google-play",
    title: "Google Play & Android",
    blurb:
      "Opt-in links, email mismatches, and the 20/14 production rule — before you blame the APK.",
    posts: [
      { slug: "google-play-closed-testing-mistakes", label: "Play Console closed testing mistakes" },
      { slug: "how-to-run-a-closed-app-test", label: "How to run a closed app test" },
    ],
    tag: "google-play",
  },
  {
    id: "app-store",
    title: "App Store & TestFlight",
    blurb:
      "Build expiry, beta review, demo accounts, and privacy labels — the iOS traps that look like code bugs.",
    posts: [
      { slug: "app-store-testflight-mistakes", label: "TestFlight & App Store mistakes" },
      { slug: "how-to-run-a-closed-app-test", label: "How to run a closed app test" },
    ],
    tag: "app-store",
  },
  {
    id: "saas",
    title: "SaaS & web apps",
    blurb:
      "Onboarding, pricing, integrations, and the gap between \"deployed\" and \"ready to charge.\"",
    posts: [
      { slug: "saas-launch-mistakes", label: "SaaS launch mistakes" },
      { slug: "app-feedback-questions", label: "App feedback questions that work" },
    ],
    tag: "saas",
  },
  {
    id: "feedback",
    title: "Structured feedback",
    blurb:
      "Questions, review format, and what to do with the notes once testers actually write them.",
    posts: [
      { slug: "structured-app-feedback", label: "Structured app feedback" },
      { slug: "app-feedback-questions", label: "Feedback questions that get honest answers" },
      { slug: "what-to-do-with-tester-feedback", label: "What to do with tester feedback" },
    ],
    tag: "feedback",
  },
] as const;

export default function GuidesPage() {
  const postCount = getBlogPosts().length;

  return (
    <div className="atmosphere">
      <div className="mx-auto w-full max-w-[720px] px-4 py-12">
        <p className="font-mono text-[12px] text-ink/50">Guides</p>
        <h1 className="mt-2 font-display text-[32px] font-semibold">
          Publishing &amp; testing guides
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
          {postCount} essays for indie makers shipping on Google Play, the App
          Store, Steam, itch, or the web. Pick a topic — each links to free
          articles you can read without an account.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/blog/tag/testers" className="pill pill-blue">
            Testers
          </Link>
          <Link href="/blog/tag/closed-test" className="pill">
            Closed testing
          </Link>
          <Link href="/blog/tag/feedback" className="pill">
            Feedback
          </Link>
          <Link href="/blog" className="pill">
            All posts
          </Link>
        </div>

        <div className="mt-12 space-y-12">
          {GUIDE_SECTIONS.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="font-display text-[24px] font-semibold">
                {section.title}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink/70">
                {section.blurb}
              </p>
              <ul className="mt-4 space-y-2">
                {section.posts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-[15px] text-blue"
                    >
                      {post.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-[6px] border border-border bg-mist/60 px-5 py-5">
          <p className="font-display text-[18px] font-semibold">Ready to test?</p>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/70">
            Post a tester or feedback request on Dozen. Structured reviews,
            14-day runs, and dots that reward quality — not volume.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-primary">
              Join Dozen
            </Link>
            <Link href="/pricing" className="btn btn-secondary">
              Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
