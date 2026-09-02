import type { Platform } from "@/lib/constants";

/**
 * Distribution access rules (Apple / Google docs):
 * - iOS App Store (live): public listing URL is enough; no closed-track opt-in.
 * - iOS TestFlight: optional public join link for pre-release builds.
 * - Android Play closed testing: email opt-in via Play Console link is required.
 * - Web: no store opt-in.
 */
export function playConsoleOptInRequired(platform: Platform): boolean {
  return platform === "android";
}

export function showsBetaAccessField(platform: Platform): boolean {
  return platform !== "web";
}

export function betaAccessLinkRequired(platform: Platform): boolean {
  return playConsoleOptInRequired(platform);
}

export function betaAccessLinkLabel(platform: Platform): string {
  if (platform === "android") return "Play Console opt-in link";
  return "TestFlight link (optional)";
}

export function betaAccessLinkPlaceholder(platform: Platform): string {
  if (platform === "android") return "https://play.google.com/apps/testing/…";
  return "https://testflight.apple.com/join/…";
}

export function betaAccessLinkHint(platform: Platform): string {
  if (platform === "android") {
    return "Closed testing on Google Play needs this link so testers can opt in with the same email they use below.";
  }
  if (platform === "ios") {
    return "Live on the App Store? Your App URL is enough. TestFlight link only if you are still in beta.";
  }
  return "";
}

export function iosFeedbackOnlyHint(): string {
  return "Already on the App Store and only need written feedback? Use the Feedback tab — no testers, TestFlight, or Play Console required.";
}

export function appUrlPlaceholder(platform: Platform): string {
  if (platform === "ios") return "https://apps.apple.com/app/…";
  if (platform === "android") return "https://play.google.com/store/apps/details?id=…";
  return "https://…";
}

export function appUrlHint(platform: Platform): string | null {
  if (platform === "ios") {
    return "App Store listing URL. Enough for live apps when you only need feedback.";
  }
  if (platform === "android") {
    return "Play Store listing URL. Separate from the closed-testing opt-in link.";
  }
  return null;
}

export function joinOptInButtonLabel(platform: Platform): string {
  if (platform === "android") return "Open Play Console opt-in";
  if (platform === "ios") return "Open TestFlight";
  return "Open app";
}

export function joinOptInEmailLabel(platform: Platform): string {
  if (platform === "android") return "Google account for Play opt-in";
  return "Email for updates";
}

export function joinOptInEmailPlaceholder(platform: Platform): string {
  if (platform === "android") return "you@gmail.com";
  return "you@example.com";
}

export function joinStartedMessage(platform: Platform, hasOptInLink: boolean): string {
  if (platform === "android" && hasOptInLink) {
    return "Commitment started. Opt in through the Play Console link today.";
  }
  if (platform === "ios" && hasOptInLink) {
    return "Commitment started. Install via TestFlight, then check in from My tests.";
  }
  return "Commitment started. Open the app from the post link, then check in from My tests.";
}

export function commitmentOptInLinkLabel(platform: Platform): string {
  if (platform === "android") return "Play Console opt-in";
  if (platform === "ios") return "TestFlight";
  return "Access link";
}

export function normalizePlatform(value: string | null | undefined): Platform {
  if (value === "ios" || value === "android" || value === "web") return value;
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
