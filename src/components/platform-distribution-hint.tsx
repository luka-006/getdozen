import Link from "next/link";
import type { Platform } from "@/lib/constants";

export function PlatformDistributionHint({ platform }: { platform: Platform }) {
  if (platform !== "ios") return null;

  return (
    <p className="rounded-[6px] border border-border bg-mist/60 px-3 py-2 text-[12px] leading-relaxed text-ink/70">
      Already on the App Store and only need written feedback? Use the{" "}
      <Link href="/requests/new?type=feedback" className="font-medium text-blue">
        Feedback
      </Link>{" "}
      tab — no testers, TestFlight, or Play Console required.
    </p>
  );
}
