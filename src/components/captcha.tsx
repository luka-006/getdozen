"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
          size?: "normal" | "compact" | "flexible";
          retry?: "auto" | "never";
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
  const [failed, setFailed] = useState(false);
  const [scriptKey, setScriptKey] = useState(0);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  const failWidget = useCallback(() => {
    if (inputRef.current) inputRef.current.value = "";
    if (widgetId.current && window.turnstile) {
      window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    }
    setFailed(true);
  }, []);

  const renderWidget = useCallback(() => {
    if (failed || !siteKey || !hostRef.current || !window.turnstile) return;
    if (widgetId.current) return;
    widgetId.current = window.turnstile.render(hostRef.current, {
      sitekey: siteKey,
      action,
      size: "compact",
      retry: "auto",
      callback: (token) => {
        if (inputRef.current) inputRef.current.value = token;
      },
      "expired-callback": () => {
        if (inputRef.current) inputRef.current.value = "";
      },
      "error-callback": () => failWidget(),
    });
  }, [action, failed, failWidget, siteKey]);

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [renderWidget, scriptKey]);

  useEffect(() => {
    if (failed || !siteKey) return;
    const poll = window.setInterval(() => {
      if (window.turnstile && hostRef.current && !widgetId.current) {
        renderWidget();
        window.clearInterval(poll);
      }
    }, 250);
    return () => window.clearInterval(poll);
  }, [failed, renderWidget, siteKey, scriptKey]);

  useEffect(() => {
    if (resetSignal == null || resetSignal === "" || resetSignal === 0) return;
    if (widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [resetSignal]);

  function retryLoad() {
    if (widgetId.current && window.turnstile) {
      window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    }
    if (inputRef.current) inputRef.current.value = "";
    setFailed(false);
    setScriptKey((key) => key + 1);
  }

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
          {!failed ? (
            <Script
              key={scriptKey}
              src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
              strategy="afterInteractive"
              onLoad={renderWidget}
              onError={() => failWidget()}
            />
          ) : null}
          <input type="hidden" name="cf-turnstile-response" ref={inputRef} />
          {failed ? (
            <div className="space-y-2 rounded-[6px] border border-border bg-mist px-3 py-2 text-[12px] text-ink/70">
              <p>
                Bot check could not load (ad blocker or network). Turn those off
                and refresh, or use Google sign-in.
              </p>
              <button
                type="button"
                className="text-blue hover:underline"
                onClick={retryLoad}
              >
                Retry bot check
              </button>
            </div>
          ) : (
            <div ref={hostRef} className="captcha-host pt-1" />
          )}
        </>
      ) : null}
    </>
  );
}
