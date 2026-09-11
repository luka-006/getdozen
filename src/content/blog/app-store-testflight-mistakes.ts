import type { BlogPost } from "@/lib/blog";

export const appStoreTestflightMistakes: BlogPost = {
  slug: "app-store-testflight-mistakes",
  title: "TestFlight and App Store mistakes indie devs repeat every launch",
  description:
    "Expired builds, missing privacy labels, and TestFlight links testers cannot open. Common iOS launch traps before your app hits the App Store.",
  publishedAt: "2026-09-10",
  updatedAt: "2026-09-10",
  tags: ["ios", "testflight", "app-store", "testers"],
  faq: [
    {
      question: "Why did TestFlight stop working for my testers?",
      answer:
        "Builds expire after ninety days. External groups also need Apple's beta review on the first build. A link that worked in March is a brick in June if you never uploaded a fresh build.",
    },
    {
      question: "What gets indie apps rejected from the App Store?",
      answer:
        "Demo logins missing, privacy labels that do not match behavior, placeholder screenshots, and apps that look like a wrapped website with no native value. Reviewers test the binary, not your landing page copy.",
    },
  ],
  body: `iOS launches feel stricter because they are. Apple reviews the thing you ship and the story you tell about it. TestFlight is the rehearsal. Most teams treat it as a share link.

These are the failures that eat your first two weeks.

## You sent a TestFlight link for a build Apple has not approved

External testers need beta app review on the first build. Internal testers do not, but you probably do not have twenty-five coworkers with company emails. If your friend taps the link and sees nothing, check App Store Connect before you rewrite onboarding.

## Your build expired and nobody noticed

TestFlight builds last ninety days. Calendar time, not "when we last thought about it." Schedule a rebuild before the link dies mid-[closed test](/blog/how-to-run-a-closed-app-test). Nothing erodes trust faster than "it worked last month."

## Review rejection: no demo account

If login is required, provide a working demo user in App Store Connect notes. "Just sign up" is not a reviewer workflow when signup needs SMS, payment, or approval. They will reject. You will argue on Twitter. Fix the sandbox account instead.

## Privacy nutrition labels do not match reality

Analytics, crash reporting, email, payments — if the SDK collects it, the label must say so. Reviewers compare the form to the app. Mismatch is an automatic conversation you did not want.

## Screenshots sell a different product

Marketing frames from a Figma file that never shipped. Review flags it. Users one-star it. Your [testers](/blog/why-12-testers) already knew the home screen was confusing; the store page promised a different app entirely.

## You stayed in TestFlight because public launch is scary

TestFlight is not a business model. At some point you need App Store metadata, pricing, and support email that works. "Beta" for a year usually means you are avoiding [structured feedback](/blog/structured-app-feedback), not gathering it.

## Live on the store but only need written answers?

You do not need another TestFlight seat. Post a feedback request with your App Store URL. Testers read the listing, use the app, and answer your questions. Save TestFlight for builds that are not public yet.

Ship the binary. Tell the truth in the forms. Give testers a job, not a tour. iOS punishes fiction early, which is annoying and useful.`,
};
