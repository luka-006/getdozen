import type { BlogPost } from "@/lib/blog";

export const saasLaunchMistakes: BlogPost = {
  slug: "saas-launch-mistakes",
  title: "SaaS launch mistakes when your \"beta\" is already public",
  description:
    "Shipping a signup page without onboarding, hiding pricing, and calling it a beta forever. Common web app launch failures that user testing catches early.",
  publishedAt: "2026-09-10",
  updatedAt: "2026-09-10",
  tags: ["saas", "web", "launch", "feedback"],
  faq: [
    {
      question: "What should you test before launching a SaaS product?",
      answer:
        "Watch one stranger complete signup, reach the core action, and understand what they would pay for — without you explaining it on a call. If that fails, more landing page copy will not save you.",
    },
    {
      question: "Is a public signup page the same as a beta?",
      answer:
        "No. A beta has a defined build, a time box, and feedback you will read. A public signup with empty states and a hidden pricing page is just an early launch with extra anxiety.",
    },
  ],
  body: `Web apps skip the store review, which makes it easy to confuse "deployed" with "ready." Your URL is live. Stripe is connected. The hero says "revolutionary." None of that is a launch.

SaaS fails in the gap between promise and first successful session.

## Signup works. Onboarding does not.

They verify email. They land on a blank dashboard. A tooltip tour appears. They close it. They leave. You count a "user."

The test is simple: can someone who has never heard your pitch do the one thing the product exists for in under ten minutes? If not, you do not need ads. You need a shorter path or a narrower product.

## Pricing is a mystery until checkout

"Hm, interesting" is not a business model. If you are ashamed of the price, fix the offer or fix the product. Hiding cost until the card form trains people to bounce at the last step — and gives you useless top-of-funnel numbers.

Tell [testers what you think you charge](/blog/app-feedback-questions) and ask if they believe it. Disbelief is cheaper before you wire up affiliates.

## "Book a demo" when the product should be self-serve

Calendars are a filter for enterprise. If your app is a ten-dollar tool, forcing a call tells every serious indie buyer you are not ready. Either commit to sales-led or commit to product-led. Mixing them shows up as churn you blame on "the market."

## Integrations fail quietly

OAuth works in dev. Production redirect URL is wrong. Webhooks 401. The settings page says "Connected" because you never surfaced the error. Your first paying customer discovers it. They do not write a polite ticket. They churn.

Give testers a script: connect X, do Y, tell us where it broke. [Structured answers](/blog/structured-app-feedback) beat "try the integration."

## You called it beta to avoid finishing

Beta has an end date and a feedback loop. A perpetual beta is a morale trick. Ship a scope. Run [twelve testers for two weeks](/blog/how-to-run-a-closed-app-test). Close it. Change the homepage verb from "coming soon" to "start."

## Web does not need TestFlight — it needs witnesses

Post a web feedback request. No opt-in link circus. Link the live URL. Ask where they got lost. Friends will still lie; strangers on a board with [minimum answer lengths](/blog/friends-make-bad-beta-testers) lie less.

SaaS launches are not quieter than mobile. They are just easier to fake with analytics dashboards. Get one human through the loop on a screen recording before you announce.`,
};
