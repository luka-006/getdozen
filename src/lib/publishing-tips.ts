import type { Platform, ProductType } from "@/lib/constants";
import { blogPath } from "@/lib/blog";

export type PublishingTip = {
  id: string;
  text: string;
  blogSlug?: string;
};

const ANDROID_TIPS: PublishingTip[] = [
  {
    id: "android-opt-in-link",
    text: "Closed testing needs the Play Console opt-in link — not the public store listing URL.",
    blogSlug: "google-play-closed-testing-mistakes",
  },
  {
    id: "android-email-match",
    text: "Testers must opt in with the same Google account they use to install.",
    blogSlug: "google-play-closed-testing-mistakes",
  },
  {
    id: "android-20-14",
    text: "New Play accounts need 20 testers for 14 continuous days before production access.",
    blogSlug: "google-play-closed-testing-mistakes",
  },
];

const IOS_TIPS: PublishingTip[] = [
  {
    id: "ios-build-expiry",
    text: "TestFlight builds expire after 90 days — schedule a rebuild before your test ends.",
    blogSlug: "app-store-testflight-mistakes",
  },
  {
    id: "ios-demo-account",
    text: "App Store review needs a working demo login if signup is not instant.",
    blogSlug: "app-store-testflight-mistakes",
  },
  {
    id: "ios-privacy-labels",
    text: "Privacy nutrition labels must match what your SDKs actually collect.",
    blogSlug: "app-store-testflight-mistakes",
  },
];

const WEB_TIPS: PublishingTip[] = [
  {
    id: "web-onboarding",
    text: "Can a stranger reach your core action in ten minutes without a call? If not, fix onboarding first.",
    blogSlug: "saas-launch-mistakes",
  },
  {
    id: "web-pricing",
    text: "Hiding pricing until checkout trains people to bounce — test whether anyone believes your price.",
    blogSlug: "saas-launch-mistakes",
  },
  {
    id: "web-integrations",
    text: "OAuth and webhooks fail silently in prod. Give testers a connect-and-use script.",
    blogSlug: "saas-launch-mistakes",
  },
];

const STEAM_TIPS: PublishingTip[] = [
  {
    id: "steam-playtest-vs-store",
    text: "Live on the store page? You may only need a feedback post, not a playtest link.",
  },
  {
    id: "steam-build-branch",
    text: "Say which branch or depot testers should use — default library installs are not obvious.",
  },
];

const ITCH_TIPS: PublishingTip[] = [
  {
    id: "itch-demo-link",
    text: "Link the exact itch page or demo build, not a trailer on YouTube.",
  },
  {
    id: "itch-platform-build",
    text: "Name the OS build you want tested (Windows, Mac, Linux, web).",
  },
];

const UNIVERSAL_TIPS: PublishingTip[] = [
  {
    id: "universal-job",
    text: "Give testers a job and a duration — not \"play around and tell me what you think.\"",
    blogSlug: "how-to-run-a-closed-app-test",
  },
  {
    id: "universal-stars",
    text: "Do not mix honest feedback with \"please leave a five-star review\" in the same run.",
    blogSlug: "structured-app-feedback",
  },
];

/** Platform-specific pitfalls shown while posting a request. */
export function publishingTipsFor(
  platform: Platform,
  productType: ProductType,
): PublishingTip[] {
  const platformTips =
    platform === "android"
      ? ANDROID_TIPS
      : platform === "ios"
        ? IOS_TIPS
        : platform === "web"
          ? WEB_TIPS
          : platform === "steam"
            ? STEAM_TIPS
            : platform === "itch"
              ? ITCH_TIPS
              : [];

  const tips = [...platformTips.slice(0, 2), ...UNIVERSAL_TIPS.slice(0, 1)];
  if (productType === "game" && platform === "web") {
    return tips.filter((t) => t.id !== "web-onboarding");
  }
  return tips;
}

export function publishingTipBlogHref(slug: string) {
  return blogPath(slug);
}
