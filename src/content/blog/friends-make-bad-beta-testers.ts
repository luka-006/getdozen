import type { BlogPost } from "@/lib/blog";

export const friendsMakeBadBetaTesters: BlogPost = {
  slug: "friends-make-bad-beta-testers",
  title: "Your friends will say they like it. Testers won't.",
  description:
    "Friends will protect your feelings. That is why they make terrible beta testers. Here is who should actually use your app before you launch.",
  publishedAt: "2026-08-22",
  updatedAt: "2026-08-22",
  tags: ["testers", "feedback", "beta"],
  faq: [
    {
      question: "Can I use friends as beta testers?",
      answer:
        "Use them to check that the build opens. Do not use them as your only sample. They already want you to succeed, so they skip the honest 'I would not open this again' sentence.",
    },
    {
      question: "Are Discord community members better than friends?",
      answer:
        "A little. They still share your taste and your jokes. You want a few people who do not owe you a vibe and will not see you at dinner on Sunday.",
    },
  ],
  body: `Ask your mum if the app is good and she will say yes. Ask your co-founder. Same answer, faster. Ask the group chat that watched you build it for nine months and they will tap around for four minutes, send a fire emoji, and go back to their lives.

That is not malice. It is manners. People who like you do not want to be the person who says "I still don't know what this is for."

You need that sentence. It is the one that saves you from launching a tour of your own brain.

## What friends are good for

Friends are a smoke test. Does the link open. Does signup work on a second phone. Did you forget the Android build. That is a 20-minute job. Thank them. Do not put their quotes in your launch thread as if they were customers.

If a friend is also your exact user — a designer who already pays for the category, a parent who already uses three tracker apps — treat them as one tester, not as the whole panel. Still get eleven more who are not in your photos.

## The closed-test trap

Play Console closed testing and TestFlight feel serious because Google and Apple gave you a URL. The URL is not the sample. A list of 200 emails from Twitter is a mailing list. Most of them will never open the app twice.

The useful unit is a person who agreed to a duration, used the thing on more than one day, and wrote answers you did not dictate. On Dozen that looks like a tester commitment: they join a post, they check in, missed days have a limit, and the cubes fill only when they actually showed up. Empty cubes are information. A silent TestFlight seat is not.

## Strangers are kinder, in the way that matters

A stranger on a testing board does not need you to feel proud. They need the task to be small and the questions to be clear. They will tell you the onboarding was a maze because they do not have to see your face after.

That can sting for an afternoon. It is cheaper than a quiet launch.

If you are worried testers will be random people with no context: good. Your future users will also have no context. The App Store screenshot is not a walkthrough from you.

## How to stop coaching the result

Do not sit in a Meet and say "now click the blue button, see, that's the aha." You just performed the product. Write a one-line brief. Point them at the build. Collect [structured feedback](/blog/structured-app-feedback) with written minimums so "looks good" does not count.

Twelve independent people beats forty friends. If you only have friends today, use them for the crash check, then post the test where people get paid to be honest. Credits are a cleaner contract than "I'll owe you one."`,
};
