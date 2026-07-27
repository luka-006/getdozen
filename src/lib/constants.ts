export const CORE_QUESTIONS = [
  "In your own words, what does this app do?",
  "Where did you get stuck, confused, or annoyed?",
  "Would you pay for this? How much, and if not, why not?",
] as const;

export const MIN_QUESTIONS = 10;
export const MAX_QUESTIONS = 30;
export const MIN_ANSWER_CHARS = 40;
export const DAILY_REVIEW_LIMIT = 3;
export const RAMP_REVIEW_COUNT = 5;
export const RAMP_RATE = 0.5;
export const SIGNUP_BONUS = 1;
export const TESTER_COST = 2;
export const TESTER_EARN = 3;
export const MAX_CONCURRENT_COMMITMENTS = 3;
export const MAX_CONCURRENT_COMMITMENTS_PRO = 5;
export const MAX_MISSED_CHECKINS = 3;
export const TESTER_DAYS = 14;
export const AUTO_CONFIRM_HOURS = 48;
export const BOUNTY_HOURS = 72;
export const BOUNTY_MULTIPLIER = 1.5;
export const REQUEST_EXPIRY_DAYS = 30;
export const CREDIT_EXPIRY_MONTHS = 6;
export const LAUNCH_BONUS_DAYS = 14;
export const PURCHASE_CAP_FREE_CREDITS = 3;
export const FOCUS_TAGS = ["UX", "Market", "Technical"] as const;

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

export function creditCostForQuestionCount(count: number): number {
  if (count <= 15) return 1;
  if (count <= 25) return 1.5;
  return 2;
}

export function minSecondsForQuestionCount(count: number): number {
  return Math.max(60, count * 20);
}
