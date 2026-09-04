import type { Platform, ProductType } from "@/lib/constants";

export function PlatformDistributionHint({
  platform,
  productType,
}: {
  platform: Platform;
  productType: ProductType;
}) {
  if (productType === "game" && (platform === "steam" || platform === "itch")) {
    return (
      <p className="rounded-[6px] border border-border bg-mist/60 px-3 py-2 text-[12px] leading-relaxed text-ink/70">
        Already on the store and only need written feedback? Use the{" "}
        <a href="/requests/new?type=feedback" className="font-medium text-blue">
          Feedback
        </a>{" "}
        tab — no testers or playtest link required.
      </p>
    );
  }

  if (productType === "app" && platform === "ios") {
    return (
      <p className="rounded-[6px] border border-border bg-mist/60 px-3 py-2 text-[12px] leading-relaxed text-ink/70">
        Already on the App Store and only need written feedback? Use the{" "}
        <a href="/requests/new?type=feedback" className="font-medium text-blue">
          Feedback
        </a>{" "}
        tab — no testers, TestFlight, or Play Console required.
      </p>
    );
  }

  return null;
}
