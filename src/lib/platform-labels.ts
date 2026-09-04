import type { Platform, ProductType } from "@/lib/constants";

export const PLATFORM_LABELS: Record<Platform, string> = {
  web: "Web",
  ios: "iOS",
  android: "Android",
  steam: "Steam",
  itch: "itch.io",
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  app: "App",
  game: "Game",
};
