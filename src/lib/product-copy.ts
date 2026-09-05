import type { Platform, ProductType } from "@/lib/constants";

export function isGameProduct(productType?: string | null): boolean {
  return productType === "game";
}

/** Lowercase noun: "app" | "game" */
export function productNoun(productType?: string | null): "app" | "game" {
  return isGameProduct(productType) ? "game" : "app";
}

/** Title case label: "App" | "Game" */
export function productLabel(productType?: string | null): "App" | "Game" {
  return isGameProduct(productType) ? "Game" : "App";
}

export function openProductLabel(productType?: string | null): string {
  return isGameProduct(productType) ? "Open game" : "Open app";
}

export function productArticle(productType?: string | null): string {
  return isGameProduct(productType) ? "the game" : "the app";
}

export function requestTrackEyebrow(requestType: string): string {
  if (requestType === "feedback") return "Feedback request";
  if (requestType === "combo") return "Dozen pack";
  return "Tester request";
}

export function joinInstallHint(
  platform: Platform,
  productType?: string | null,
): string {
  if (platform === "ios") {
    return "Install from the App Store link above";
  }
  return isGameProduct(productType)
    ? "Open the game from the link above"
    : "Open the app from the link above";
}

export function proofOpenHint(productType?: string | null): string {
  return isGameProduct(productType)
    ? "Proof — open the game first"
    : "Proof — open the app first";
}

export function proofFailedMessage(productType?: string | null): string {
  return `Proof question failed. Open ${productArticle(productType)} and try again.`;
}

export function checkinFallbackPrompt(
  productType?: string | null,
): string {
  return isGameProduct(productType)
    ? "What did you notice in the game today?"
    : "What did you notice in the app today?"
}

export function checkinFallbackPromptAlt(
  productType?: string | null,
): string {
  return isGameProduct(productType)
    ? "What did you see in the game today?"
    : "What did you see in the app today?";
}

export function coreUiElementHint(productType?: string | null): string {
  return isGameProduct(productType)
    ? "button, screen, level…"
    : "button, screen, menu…";
}

export function concurrentTesterLimitMessage(
  maxSlots: number,
  isPro: boolean,
  proMax: number,
): string {
  const noun = maxSlots === 1 ? "product" : "products";
  if (isPro) {
    return `You're already testing ${maxSlots} ${noun}`;
  }
  return `You're already testing ${maxSlots} ${maxSlots === 1 ? "product" : "products"}. Pro lets you test ${proMax} at once.`;
}

export function joinMailProductLinkHint(productType?: ProductType | string | null): string {
  return isGameProduct(productType)
    ? "Open the post for the game link."
    : "Open the post for the app link.";
}
