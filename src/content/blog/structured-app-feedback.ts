import type { BlogPost } from "@/lib/blog";

export const structuredAppFeedback: BlogPost = {
  slug: "structured-app-feedback",
  title: "Star ratings don't ship features. Written answers do.",
  description:
    "A five-star review is a compliment. A written answer to where you got stuck is a bug list. How to collect app feedback you can actually ship from.",
  publishedAt: "2026-08-22",
  updatedAt: "2026-08-22",
  tags: ["feedback", "questions", "reviews"],
  faq: [
    {
      question: "What is structured app feedback?",
      answer:
        "Fixed questions with a real minimum length, answered while the person still has the build. Not a star, not a GIF in Discord, not 'looks sick.'",
    },
    {
      question: "How many questions should I ask testers?",
      answer:
        "Start at ten. That is the Dozen floor. Thirty is the ceiling. Past that, people skim and you get the same three thoughts padded out.",
    },
  ],
  body: `A star is a mood. It is not a task. You cannot ticket "4 stars." You can ticket "I thought this was a habit tracker and it is a calendar, so I left."

Makers collect the mood because it is easy. TestFlight crash-free, a few hearts on Discord, a friend who says they would pay. Then the public launch is quiet and nobody can say why.

Structured feedback is boring on purpose. Same questions for every tester. A floor on how much they have to write. You compare answers instead of vibes.

## The three questions that should always be there

Dozen starts every feedback request with the same three, before your extras:

1. In your own words, what does this app do?
2. Where did you get stuck, confused, or annoyed?
3. Would you pay for this? How much, and if not, why not?

The first one is a positioning test. If six people describe six products, your store listing will not save you. The second is the actual backlog. The third is rude and useful. "I would not pay" with a reason beats a polite maybe.

You need at least ten questions in total, up to thirty. Answers have to clear a word floor. "Nice UI" fails. That is not us being precious. Short praise is how people exit a form without thinking.

## Stars, NPS, and other decoys

NPS is a board-slide number. "Would you recommend this" after a ten-minute closed test is a guess. People recommend tools they have lived in, not builds they sideloaded yesterday.

Public reviews are worse for product work. They are written for other buyers, after the refund window, with no prompt. You will get "please add widgets" from someone who never opened settings.

Use ratings later, when you have a store presence to maintain. Use sentences now.

## How to read a pile of answers without drowning

Print the "stuck" answers. Highlight the same screen or the same verb. Three mentions of the same stall is a fix. One mention of an integration you were already dreaming about is bait.

Read the "what does it do" answers last. If they match your landing page, you are clear. If they do not, rewrite the first screen before you add features. Features on a confused product are extra rooms in a house with no door.

There is a longer walkthrough in [what to do with tester feedback](/blog/what-to-do-with-tester-feedback). The short version: cluster, cut the one-offs, ship the repeat.

## Feedback is not a survey mill

If you pay people to mash a form, they will mash a form. The Dozen side that keeps this slightly honest is the tester flow: duration, check-ins, and a cap on how many reviews you can rush in a day. It is still the internet. You will get a lazy answer sometimes. Twelve people make that obvious. Two friends do not.

Ask better prompts. [Here are the ones that work](/blog/app-feedback-questions). Then go get [twelve testers](/blog/why-12-testers), not a thousand anonymous stars.`,
};
