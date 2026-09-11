import type { BlogPost } from "@/lib/blog";

export const googlePlayClosedTestingMistakes: BlogPost = {
  slug: "google-play-closed-testing-mistakes",
  title: "Google Play closed testing mistakes that burn your first testers",
  description:
    "Wrong opt-in links, email mismatches, and twenty installs with zero feedback. The usual Play Console closed-test failures and how to fix them before you post.",
  publishedAt: "2026-09-10",
  updatedAt: "2026-09-10",
  tags: ["android", "google-play", "closed-test", "testers"],
  faq: [
    {
      question: "Why do Google Play closed testers say they cannot install?",
      answer:
        "Usually the opt-in link is wrong, the track is not published, or they used a different Google account than the one they gave you. All three look like \"your app is broken\" from their side.",
    },
    {
      question: "How many testers does Google Play require for production?",
      answer:
        "Twenty testers opted in for fourteen continuous days on a closed track before you can apply for production access on a new personal account. Plan for that before you treat closed testing as a weekend experiment.",
    },
  ],
  body: `Play Console makes closed testing look official. A link. A track. A counter. It is easy to confuse that UI with having a test.

Most indie Android launches fail in the boring layer: access, not code.

## You pasted the store listing, not the opt-in link

The Play Store URL and the closed-testing opt-in URL are different pages. Testers who open the listing see a public app or nothing useful. They do not magically join your track.

Put the opt-in link in the first line of your post. On Dozen, Android tester posts require it for a reason. If you are collecting emails for a list you will "add later," you are running two projects and finishing neither.

## Their Google account is not the account they gave you

Closed testing is email-bound. They opt in with \`you@gmail.com\`, install with \`work@gmail.com\`, and blame your APK. Ask them to confirm which account accepted the invite before you debug crashes that never happened.

This is also why a giant spreadsheet of "200 testers" is worse than [twelve people who agreed to a job](/blog/why-12-testers).

## You hit publish on the track, but not on the release

A draft release on a closed track is invisible. So is a release stuck in review. Check the track, the release status, and the countries. Then send one tester you trust a screenshot of what they should see. If they do not match, stop recruiting.

## You are trying to satisfy Google's 20/14 rule with ghosts

New developer accounts need twenty testers on a closed track for fourteen continuous days before production access unlocks. That is a compliance clock, not feedback quality. Do not confuse "I have twenty names" with "twenty people opened the app this week."

Run a real [closed test with check-ins](/blog/how-to-run-a-closed-app-test) in parallel if you want product signal. Use the Google quota for Google.

## You mixed "be honest" with "rate us five stars"

Closed testing is for bugs and confusion. Store campaigns are for social proof. When you ask for both in the same breath, you get neither. Testers stop writing notes. You stop trusting them. Keep the five-star ask for after you have shipped the fixes they found.

## Your testers installed once and left

Android makes install easy and return hard. No daily reason, no notes, no filled cubes — just a number on a dashboard. Give them a task, a duration, and [questions that force specificity](/blog/app-feedback-questions). Silence on day three is data.

Fix the access layer first. Then run a small loud test instead of a large quiet list.`,
};
