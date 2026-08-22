import type { BlogPost } from "@/lib/blog";

export const appFeedbackQuestions: BlogPost = {
  slug: "app-feedback-questions",
  title: "The questions that make testers tell you the truth",
  description:
    "Yes/no questions waste a tester. These prompts get stuck points, pricing honesty, and the one sentence you will actually build from after a closed test.",
  publishedAt: "2026-08-22",
  updatedAt: "2026-08-22",
  tags: ["feedback", "questions", "testers"],
  faq: [
    {
      question: "What questions should I ask beta testers?",
      answer:
        "Always ask what they think the app does, where they got stuck, and whether they would pay. Add prompts about the first screen, pricing, and the moment they almost quit. Avoid yes/no.",
    },
    {
      question: "How many questions is too many?",
      answer:
        "Past thirty, people skim. Ten good ones beat twenty-five that repeat 'any other comments.'",
    },
  ],
  body: `A tester who likes you will try to give the answer they think you want. A tester who is tired will type "yes." Your job is to make both of those paths fail.

Write questions that only work if the person looks at the app. "Is the UI clean" does not. Everyone says yes. "What would you remove from the first screen" does. Now they have to name a thing.

## Start with the three you cannot skip

Every Dozen feedback request already includes:

- In your own words, what does this app do?
- Where did you get stuck, confused, or annoyed?
- Would you pay for this? How much, and if not, why not?

If you only added those three, you would already be ahead of a star rating. The rest of the form is you aiming at the wound you already suspect. Onboarding. Pricing. The empty state. Do not aim at everything. You will get thin answers on all of it.

## Prompts that pull a sentence, not a nod

Steal these, then stop stealing once you have ten:

- How clear was the first screen after signup?
- How many steps until you understood the value?
- What would you remove from onboarding?
- Is the pricing page easy to understand?
- Which plan would you choose, and why?
- What feels overpriced or underpriced?
- Where did you almost quit?
- If you described this app to a friend, what would you say it is for?
- What did you expect to find that was missing?
- What did you find that you did not need?

Notice none of those are "did you like it." Like is a shrug.

## What to cut

Cut anything you could answer without using the app. Cut double-barrelled questions ("is it fast and intuitive"). Cut leading ones ("the new editor is simpler, right?"). Cut "any other feedback" until the end, and only if you still have room under thirty.

If you are asking testers to compare you to Notion, Figma, or whoever you wish you were, you will get fan fiction. Ask what they currently use for the job, then whether they would move. That is uglier and better.

## Length is a filter

Dozen rejects tiny answers. Forty characters and twenty-five words is not literature. It is a speed bump so "good app" bounces. If a tester complains the form is long, the form is doing the job. You paid for thought, not a tap.

Pair the questions with people who are not your [friends](/blog/friends-make-bad-beta-testers), for a [closed test they will actually finish](/blog/how-to-run-a-closed-app-test). Then read the stuck answers twice before you touch your roadmap.`,
};
