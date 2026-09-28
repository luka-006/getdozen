"use client";

import { PostHogProvider as PHProvider } from "posthog-js/react";
import type { PostHog } from "posthog-js";
import { useEffect, useState, type ReactNode } from "react";

export function PostHogProvider({ children }: { children: ReactNode }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  const [client, setClient] = useState<PostHog | null>(null);

  useEffect(() => {
    if (!key) return;

    let cancelled = false;

    const init = () => {
      void import("posthog-js").then(({ default: posthog }) => {
        if (cancelled) return;
        try {
          posthog.init(key, {
            api_host:
              process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ||
              "https://eu.i.posthog.com",
            person_profiles: "identified_only",
            capture_pageview: true,
            capture_pageleave: true,
          });
          setClient(posthog);
        } catch (err) {
          console.error("PostHog init failed", err);
        }
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(init, { timeout: 3000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = setTimeout(init, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [key]);

  if (!key || !client) {
    return children;
  }

  return <PHProvider client={client}>{children}</PHProvider>;
}
