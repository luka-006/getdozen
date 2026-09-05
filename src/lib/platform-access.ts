import type { Platform, ProductType } from "@/lib/constants";
import { productArticle } from "@/lib/product-copy";

/**
 * Distribution access rules:
 * - Android Play closed testing: email opt-in via Play Console link (required).
 * - iOS TestFlight / Steam Playtest: optional beta access links.
 * - Live store listings (App Store, Play Store, Steam, itch): listing URL is enough.
 * - Web / itch: no separate opt-in track.
 */
export function playConsoleOptInRequired(platform: Platform): boolean {
  return platform === "android";
}

export function showsBetaAccessField(platform: Platform): boolean {
  return platform === "android" || platform === "ios" || platform === "steam";
}

export function betaAccessLinkRequired(platform: Platform): boolean {
  return playConsoleOptInRequired(platform);
}

export function betaAccessLinkLabel(platform: Platform): string {
  if (platform === "android") return "Play Console opt-in link";
  if (platform === "steam") return "Steam Playtest link (optional)";
  if (platform === "ios") return "TestFlight link (optional)";
  return "Beta access link (optional)";
}

export function betaAccessLinkPlaceholder(platform: Platform): string {
  if (platform === "android") return "https://play.google.com/apps/testing/…";
  if (platform === "steam") return "https://preview.example/playtest/…";
  if (platform === "ios") return "https://testflight.apple.com/join/…";
  return "https://…";
}

export function betaAccessLinkHint(platform: Platform): string {
  if (platform === "android") {
    return "Closed testing on Google Play needs this link so testers can opt in with the same email they use below.";
  }
  if (platform === "steam") {
    return "Live on the store page above? Playtest link is optional. Feedback-only? Use the Feedback tab.";
  }
  if (platform === "ios") {
    return "Live on the App Store? Your listing URL is enough. TestFlight link only if you are still in beta.";
  }
  return "";
}

export function iosFeedbackOnlyHint(): string {
  return "Already live and only need written feedback? Use the Feedback tab — no testers or beta links required.";
}

export function gameFeedbackOnlyHint(): string {
  return "Already on the store and only need written feedback? Use the Feedback tab — no testers or playtest link required.";
}

export function appUrlPlaceholder(platform: Platform): string {
  if (platform === "ios") return "https://apps.apple.com/app/…";
  if (platform === "android") return "https://play.google.com/store/apps/details?id=…";
  if (platform === "steam") return "https://preview.example/games/your-game";
  if (platform === "itch") return "https://preview.example/itch/your-game";
  return "https://…";
}

export function appUrlHint(platform: Platform): string | null {
  if (platform === "ios") {
    return "App Store listing URL. Enough for live apps when you only need feedback.";
  }
  if (platform === "android") {
    return "Play Store listing URL. Separate from the closed-testing opt-in link.";
  }
  if (platform === "steam") {
    return "Store page URL for your game. Enough when you only need feedback.";
  }
  if (platform === "itch") {
    return "Game page URL. Reviewers can try the demo or read the page.";
  }
  return null;
}

export function joinOptInButtonLabel(
  platform: Platform,
  productType?: ProductType | string | null,
): string {
  if (platform === "android") return "Open Play Console opt-in";
  if (platform === "steam") return "Open Playtest";
  if (platform === "ios") return "Open TestFlight";
  return productType === "game" ? "Open game" : "Open app";
}

export function joinOptInEmailLabel(platform: Platform): string {
  if (platform === "android") return "Google account for Play opt-in";
  return "Email for updates";
}

export function joinOptInEmailPlaceholder(platform: Platform): string {
  if (platform === "android") return "you@gmail.com";
  return "you@example.com";
}

export function joinStartedMessage(
  platform: Platform,
  hasOptInLink: boolean,
  productType?: ProductType | string | null,
): string {
  if (platform === "android" && hasOptInLink) {
    return "Commitment started. Opt in through the Play Console link today.";
  }
  if (platform === "steam" && hasOptInLink) {
    return "Commitment started. Install via Playtest, then check in from My tests.";
  }
  if (platform === "ios" && hasOptInLink) {
    return "Commitment started. Install via TestFlight, then check in from My tests.";
  }
  return `Commitment started. Open ${productArticle(productType)} from the post link, then check in from My tests.`;
}

export function commitmentOptInLinkLabel(platform: Platform): string {
  if (platform === "android") return "Play Console opt-in";
  if (platform === "steam") return "Playtest";
  if (platform === "ios") return "TestFlight";
  return "Access link";
}

export function normalizePlatform(value: string | null | undefined): Platform {
  if (
    value === "ios" ||
    value === "android" ||
    value === "web" ||
    value === "steam" ||
    value === "itch"
  ) {
    return value;
  }
  return "web";
}

export function isValidOptInUrl(value: string | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
