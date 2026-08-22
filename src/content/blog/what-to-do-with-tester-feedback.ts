import type { BlogPost } from "@/lib/blog";

export const whatToDoWithTesterFeedback: BlogPost = {
  slug: "what-to-do-with-tester-feedback",
  title: "You have twelve tester reports. Now what.",
  description:
    "Twelve tester reports feel like noise until you sort them. A simple way to turn closed-test notes into a ship list without rebuilding the whole app.",
  publishedAt: "2026-08-22",
  updatedAt: "2026-08-22",
  tags: ["feedback", "testers", "launch"],
  faq: [
    {
      question: "How do I prioritize beta tester feedback?",
      answer:
        "Count repeats. A stuck point that shows up four times beats a feature request that shows up once. Fix the door before you add rooms.",
    },
    {
      question: "Should I implement everything testers ask for?",
      answer:
        "No. Testers are not your board. They are a sample of confusion and desire. Your job is to notice the pattern, not to merge every wish.",
    },
  ],
  body: `The worst week is the week after a good test. You have twelve write-ups. Each one is convincing. Together they ask for three different products. If you try to please all of them you will ship a hallway.

You do not need a research tool. You need a table and a red pen.

## Make three piles, not a spreadsheet religion

Pile one: **stuck**. Anything about not knowing where to go, errors, "I thought it was X." This is the door. Fix it first.

Pile two: **pay**. Would they pay, how much, why not. If nobody would pay, do not spend a month on polish. Spend it on the offer, the first screen, or admitting the audience is wrong.

Pile three: **wishes**. Widgets, integrations, dark mode, "could this also do my taxes." Wishes are optional. They feel productive because they are additive. Additive is how indie apps die.

If a note fits two piles, put it in stuck. Confusion disguised as a feature request is still confusion.

## Count, then ignore the lonely ones

Four people stalled on the same empty state. That is the sprint. One person wants CSV, Notion sync, and a public API. That person might be your future enterprise lead. They are not this week's user.

You will feel rude ignoring a detailed wish. You are not ignoring the person. You are refusing to let a sample of twelve become a steering committee.

## Rewrite the first screen before you rewrite the app

Read the "what does this app do" answers as if you had never built it. If they do not match your landing page, the landing page is lying or the product is. Pick one and change it. Do not add a tooltip tour on top of a confused home. Tours are how we hide naming problems.

Then ship. A closed test that does not change the build was a book report.

## Run another dozen if you still have a live question

One round answers "is the first hour broken." It does not answer "will anyone stay in week three" unless you ran a longer duration. If you need that, change the question and the calendar. Do not keep the same twelve people on Slack forever. They will start sounding like teammates.

[Twelve testers](/blog/why-12-testers) is a staffing choice. [Structured questions](/blog/app-feedback-questions) is the instrument. This is the part where you close the laptop on the quotes you will not build, and open the editor on the ones you will.

When you want another round, [post it](/pricing). Same size. New build. Read again.`,
};
