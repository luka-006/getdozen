"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import type { TurnstileAction } from "@/lib/bot-guard";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          action?: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

export function Captcha({
  action,
  resetSignal,
}: {
  action: TurnstileAction;
  resetSignal?: string | number | null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  function renderWidget() {
    if (!siteKey || !hostRef.current || !window.turnstile) return;
    if (widgetId.current) return;
    widgetId.current = window.turnstile.render(hostRef.current, {
      sitekey: siteKey,
      action,
      callback: (token) => {
        if (inputRef.current) inputRef.current.value = token;
      },
      "expired-callback": () => {
        if (inputRef.current) inputRef.current.value = "";
      },
      "error-callback": () => {
        if (inputRef.current) inputRef.current.value = "";
      },
    });
  }

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey, action]);

  useEffect(() => {
    if (resetSignal == null || resetSignal === "" || resetSignal === 0) return;
    if (widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [resetSignal]);

  return (
    <>
      <div className="hp" aria-hidden="true">
        <label>
          Company URL
          <input name="company_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {siteKey ? (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onLoad={renderWidget}
          />
          <input type="hidden" name="cf-turnstile-response" ref={inputRef} />
          <div ref={hostRef} className="pt-1" />
        </>
      ) : null}
    </>
  );
}
