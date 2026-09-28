"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const PostHogProviderInner = dynamic(
  () =>
    import("@/components/posthog-provider").then((m) => m.PostHogProvider),
  { ssr: false },
);

export function PostHogProviderLazy({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()) {
    return children;
  }

  return <PostHogProviderInner>{children}</PostHogProviderInner>;
}
