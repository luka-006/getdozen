"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useRef } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const started = useRef(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ||
      "https://eu.i.posthog.com";
    if (!key || started.current) return;
    started.current = true;

    posthog.init(key, {
      api_host: host,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
