import type { BlogPost } from "@/lib/blog";
import { appFeedbackQuestions } from "./app-feedback-questions";
import { appStoreTestflightMistakes } from "./app-store-testflight-mistakes";
import { friendsMakeBadBetaTesters } from "./friends-make-bad-beta-testers";
import { getPaidTestingApps } from "./get-paid-testing-apps";
import { googlePlayClosedTestingMistakes } from "./google-play-closed-testing-mistakes";
import { howToRunAClosedAppTest } from "./how-to-run-a-closed-app-test";
import { saasLaunchMistakes } from "./saas-launch-mistakes";
import { structuredAppFeedback } from "./structured-app-feedback";
import { whatToDoWithTesterFeedback } from "./what-to-do-with-tester-feedback";
import { whyTwelveTesters } from "./why-twelve-testers";

export const posts: BlogPost[] = [
  googlePlayClosedTestingMistakes,
  appStoreTestflightMistakes,
  saasLaunchMistakes,
  whyTwelveTesters,
  friendsMakeBadBetaTesters,
  structuredAppFeedback,
  howToRunAClosedAppTest,
  getPaidTestingApps,
  appFeedbackQuestions,
  whatToDoWithTesterFeedback,
];
