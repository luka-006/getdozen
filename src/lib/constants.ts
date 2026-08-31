export const CORE_QUESTIONS = [
  "In your own words, what does this app do?",
  "Where did you get stuck, confused, or annoyed?",
  "Would you pay for this? How much, and if not, why not?",
] as const;

export const MIN_QUESTIONS = 10;
export const MAX_QUESTIONS = 30;
export const MIN_ANSWER_CHARS = 40;
export const MIN_ANSWER_WORDS = 25;
export const DAILY_REVIEW_LIMIT = 3;
export const RAMP_REVIEW_COUNT = 5;
export const RAMP_RATE = 0.5;
export const SIGNUP_BONUS = 1;
export const TESTER_COST = 2;
export const TESTER_EARN = 2;
export const TESTER_COMPLETION_EARN = 2;
export const CHECKIN_EARN = 1;
export const CHECKIN_INTERVAL_DAYS = 3;
export const MIN_TESTERS = 12;
export const BUG_REPORT_AWARD = 2;
export const BOOST_WAIT_DAYS = 3;
export const BOOST_HOURS = 48;

/** Testers + feedback bundles (cheaper than buying both separately). */
export const COMBO_PACKS = [
  {
    id: "combo_12_10",
    testers: 12,
    questions: 10,
    credits: 30,
    label: "12 testers · 10 questions",
  },
  {
    id: "combo_15_20",
    testers: 15,
    questions: 20,
    credits: 40,
    label: "15 testers · 20 questions",
  },
  {
    id: "combo_20_30",
    testers: 20,
    questions: 30,
    credits: 50,
    label: "20 testers · 30 questions",
  },
] as const;

export type ComboPackId = (typeof COMBO_PACKS)[number]["id"];

export function getComboPack(id: string) {
  return COMBO_PACKS.find((pack) => pack.id === id) ?? null;
}
export const MAX_CONCURRENT_COMMITMENTS = 1;
export const MAX_CONCURRENT_COMMITMENTS_PRO = 3;

export const PRO_BENEFITS = [
  "Test up to 3 apps at once",
  "Your posts rank above free accounts on the board",
  "Pro badge on posts and your profile",
] as const;
export const MAX_MISSED_CHECKINS = 3;
export const TESTER_DAYS = 14;
export const TESTER_DURATION_OPTIONS = [7, 14, 20, 30] as const;
export const MIN_TESTER_DAYS = 7;
export const MAX_TESTER_DAYS = 30;
export const AUTO_CONFIRM_HOURS = 48;
export const BOUNTY_HOURS = 72;
export const BOUNTY_MULTIPLIER = 1.5;
export const REQUEST_EXPIRY_DAYS = 30;
export const CREDIT_EXPIRY_MONTHS = 6;
export const LAUNCH_BONUS_DAYS = 14;
export const FOCUS_TAGS = ["Everything", "UX", "Market", "Technical"] as const;
export const PLATFORMS = ["web", "ios", "android"] as const;
export type Platform = (typeof PLATFORMS)[number];
export const FIRST_REVIEW_GIFT = 1;

export const QUESTION_LIBRARY = [
  {
    category: "Onboarding",
    questions: [
      "How clear was the first screen after signup?",
      "How many steps did it take before you understood the value?",
      "What would you remove from the onboarding flow?",
    ],
  },
  {
    category: "Pricing",
    questions: [
      "Is the pricing page easy to understand?",
      "Which plan would you choose, and why?",
      "What feels overpriced or underpriced?",
    ],
  },
  {
    category: "UX",
    questions: [
      "What felt slow or friction-heavy?",
      "Which action took longer than you expected?",
      "What would you rename or move?",
    ],
  },
  {
    category: "Mobile",
    questions: [
      "What broke or felt awkward on a phone?",
      "Were tap targets large enough?",
      "Did anything feel desktop-first?",
    ],
  },
  {
    category: "Landing page",
    questions: [
      "After reading the landing page, what do you think this product is for?",
      "What claim felt unconvincing?",
      "What would make you click the main CTA?",
    ],
  },
] as const;

/** Poster pays 1 credit per question. */
export function creditCostForQuestionCount(count: number): number {
  return Math.max(0, Math.floor(count));
}

/** Reviewer earn for a finished review (not 1:1 with the poster's spend). */
export function reviewEarnForQuestionCount(count: number): number {
  if (count <= 15) return 1;
  if (count <= 25) return 1.5;
  return 2;
}

export function minSecondsForQuestionCount(count: number): number {
  return Math.max(60, count * 20);
}
