"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState, type ReactNode } from "react";

export function PostHogProvider({ children }: { children: ReactNode }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!key) return;
    try {
      posthog.init(key, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ||
          "https://eu.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
      });
      setReady(true);
    } catch (err) {
      console.error("PostHog init failed", err);
    }
  }, [key]);

  if (!key || !ready) {
    return children;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
