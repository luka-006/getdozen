import type { BlogPost } from "@/lib/blog";

export const howToRunAClosedAppTest: BlogPost = {
  slug: "how-to-run-a-closed-app-test",
  title: "How to run a closed app test without losing the testers",
  description:
    "A closed test dies when people install once and vanish. Daily check-ins, a real duration, and a small group beat a giant TestFlight list that never opens.",
  publishedAt: "2026-08-22",
  updatedAt: "2026-08-22",
  tags: ["closed-test", "testers", "beta"],
  faq: [
    {
      question: "How long should a closed app test last?",
      answer:
        "A week is enough for first-run pain. Two weeks is the default if you want habits to show. Thirty days is for apps people are meant to live in. Do not pick thirty because it sounds thorough if you will not read the notes.",
    },
    {
      question: "How many people should be in a closed test?",
      answer:
        "Start with about twelve active testers, not twelve hundred names. A quiet list is worse than a small loud one.",
    },
  ],
  body: `Closed testing is supposed to mean "real people, not the public store yet." In practice it often means a waiting room. You add emails. Play Console looks official. Two people install. One of them is you on a second Gmail.

The test failed before anyone wrote feedback. You did not lose testers. You never had a reason for them to come back tomorrow.

## Pick a duration you will actually watch

On Dozen a tester post is 7, 14, 20, or 30 days. One filled cube is one calendar day they were in. That is deliberately unromantic. If the app is a one-session utility, a week will show the first-run mess. If it is a daily tool, two weeks is the default. A month only helps if you will log in and read check-ins instead of hiding from them.

Do not run a 30-day test because a growth thread said "retention." You are one person. You need a stack of answers you can act on this Thursday.

## Give testers a job, not a tour

"Play with it and tell me what you think" is how you get silence. "Use it to do the thing you already do in a notes app / habit app / freelance tracker. If you would uninstall, say so." That is a job.

Put the build link in the post. Platform matters: web, iOS, Android. If they need a closed-test code, write the code in the first line, not in a PDF.

Then get out of the way. If you hop on a call and point at buttons, you are QA-ing with a supervisor in the room. See [friends as testers](/blog/friends-make-bad-beta-testers).

## Check-ins beat a giant invite list

People drop. That is normal. What you want is to see the drop. A missed-day limit (on Dozen, three) stops a zombie slot sitting filled while nobody uses the app. Empty cubes on the board are not a UI flourish. They are the test telling you the truth.

Cap how many tests a person can juggle. A tester with eight apps open is a survey farm. Three concurrent commitments, five on Pro, is the line we use. You can disagree with the numbers. You should not disagree with the idea.

## What to collect while they are still in the build

Do not wait until day 14 and email "any thoughts?" Collect [structured written answers](/blog/structured-app-feedback) as the spine, and let the daily presence be the proof they were not a one-tap install.

If you also need store reviews later, that is a different campaign. Mixing "please five-star us" into a closed test poisons the notes. You asked them to be honest, then you asked them to be marketing.

## When the test is over

You will want to add everyone to a Slack and keep going. Don't, not yet. Close it. Read. Ship two fixes that showed up more than once. Then run another dozen if you still have questions. Serial small tests beat one endless beta that becomes your only users.

The [12-tester default](/blog/why-12-testers) is the staffing. This post is the calendar. You need both.`,
};
