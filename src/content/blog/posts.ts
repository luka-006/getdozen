import type { BlogPost } from "@/lib/blog";
import { appFeedbackQuestions } from "./app-feedback-questions";
import { friendsMakeBadBetaTesters } from "./friends-make-bad-beta-testers";
import { getPaidTestingApps } from "./get-paid-testing-apps";
import { howToRunAClosedAppTest } from "./how-to-run-a-closed-app-test";
import { structuredAppFeedback } from "./structured-app-feedback";
import { whatToDoWithTesterFeedback } from "./what-to-do-with-tester-feedback";
import { whyTwelveTesters } from "./why-twelve-testers";

export const posts: BlogPost[] = [
  whyTwelveTesters,
  friendsMakeBadBetaTesters,
  structuredAppFeedback,
  howToRunAClosedAppTest,
  getPaidTestingApps,
  appFeedbackQuestions,
  whatToDoWithTesterFeedback,
];
