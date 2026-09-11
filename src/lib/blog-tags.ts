/** SEO copy for blog tag index pages (only tags with 2+ posts are indexed). */
export type BlogTagMeta = {
  slug: string;
  label: string;
  title: string;
  description: string;
};

export const BLOG_TAG_META: Record<string, BlogTagMeta> = {
  testers: {
    slug: "testers",
    label: "Testers",
    title: "Beta testers & closed-test staffing guides",
    description:
      "How many testers to recruit, why twelve is the default, and how to keep people showing up through a 14-day run — not a ghost invite list.",
  },
  feedback: {
    slug: "feedback",
    label: "Feedback",
    title: "Structured app & game feedback guides",
    description:
      "Turn vague \"looks good\" into written answers you can ship from. Questions, review structure, and what to do with the pile of notes after.",
  },
  "closed-test": {
    slug: "closed-test",
    label: "Closed testing",
    title: "Closed app testing guides for indie makers",
    description:
      "Run a closed test that survives day three: duration, check-ins, Play Console opt-in, and why small loud groups beat giant email lists.",
  },
  beta: {
    slug: "beta",
    label: "Beta testing",
    title: "Beta testing without friendly lies",
    description:
      "Why friends make bad beta testers, how to run a closed test without losing people, and what honest pre-launch feedback actually looks like.",
  },
  launch: {
    slug: "launch",
    label: "Launch",
    title: "App & SaaS launch guides before you ship",
    description:
      "Publishing mistakes on Google Play, the App Store, and SaaS signup flows — plus what to do with tester feedback once the run ends.",
  },
  questions: {
    slug: "questions",
    label: "Questions",
    title: "App feedback questions that get honest answers",
    description:
      "Prompts and question design for closed tests and feedback requests — so testers cannot reply with a single emoji and call it a review.",
  },
};

export function blogTagLabel(slug: string): string {
  return BLOG_TAG_META[slug]?.label ?? slug.replace(/-/g, " ");
}
