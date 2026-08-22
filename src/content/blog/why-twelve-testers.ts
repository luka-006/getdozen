import type { BlogPost } from "@/lib/blog";

export const whyTwelveTesters: BlogPost = {
  slug: "why-12-testers",
  title: "Why 12 testers is the right number for an indie app",
  description:
    "Five testers find most UX bugs. Indie apps still need a dozen people if you want honest answers about money, confusion, and whether they would come back.",
  publishedAt: "2026-08-22",
  updatedAt: "2026-08-22",
  tags: ["testers", "feedback", "closed-test"],
  faq: [
    {
      question: "How many testers does an indie app need?",
      answer:
        "Twelve is a strong default. Five is enough to surface most usability issues. A dozen independent voices is enough to see whether those issues repeat, and whether anyone would pay.",
    },
    {
      question: "Is 12 testers the same as 12 App Store reviews?",
      answer:
        "No. Store reviews are public, late, and usually one sentence. Closed testers answer specific questions while they still have the build in their hands.",
    },
  ],
  body: `Dozen is named that for a reason. Not because twelve is magic. Because it is the smallest number that still feels like a group, and the largest number most solo makers will actually read.

Jakob Nielsen's old finding still holds: about five people will uncover most of the usability problems in a given flow. If you only care whether the onboarding is confusing, five is plenty. You will hear "I didn't know where to tap" more than once. You can fix it.

Indie apps are not only a usability problem. They are a "would a stranger keep this" problem. That is a different sample.

## Five testers find bugs. Twelve testers find a pattern.

With five reports you get a loud first impression. One person hates the paywall. One person never found settings. One person wants dark mode on day one. You cannot tell yet what is a real leak and what is taste.

With twelve, repeats start to show. If four people stall on the same screen, that screen is the work. If one person wants a CSV export and nobody else mentions it, it can wait. That is the whole job of a closed test: separate the stuck points from the wishlist.

Twenty testers is usually a committee. You will spend a weekend tagging quotes instead of shipping. Fifty is a fake launch. You do not have a support inbox for that yet.

## Why not just ship and read the App Store

Because store reviews arrive after the person already bounced, and they write for other shoppers, not for you. "Doesn't work on my phone" is not a repro. Five stars from your cousin is not product-market fit.

A tester who has to answer **where they got stuck**, **what they think the app does**, and **whether they would pay** is doing a different job. Those three sit at the start of every Dozen feedback request. You can add more. You cannot skip them.

## What 12 testers actually costs

On Dozen, a tester slot is two credits. Twelve slots is twenty-four credits if you buy them as testing only. The default combo is [12 testers and 10 questions](/pricing) for 30 credits, because the written answers are the point. You are not paying for installs. You are paying for people who check in across a week or a month.

Pick 7, 14, 20, or 30 days. One calendar day filled is one cube on the board. If nobody joined, you will see empty cubes. That is honest. A TestFlight list of 80 "interested" emails with three opens is the version that feels busy and tells you nothing.

## How to brief twelve people without writing a novel

Tell them the one job. "Use this like you already paid for it. Do not perform. If you would close it, close it and write why."

Do not send a 12-page spec. Do not sit on a call and narrate. You will coach them into liking it. The useful session is the one where you are not in the room.

If you are still in waitlist-for-friends mode, read [why friends make bad beta testers](/blog/friends-make-bad-beta-testers) next. Then write the [questions that get honest answers](/blog/app-feedback-questions) before you hit post.

Twelve people. One build. A pile of sentences you can ship from. That is the product.`,
};
