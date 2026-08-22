"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "dozen_cookie_notice";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "ok");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "ok");
    } catch {
      // Private mode may block storage; hide for this visit anyway.
    }
    setVisible(false);
  }

  return (
    <div className="cookie-banner" role="dialog" aria-labelledby="cookie-banner-title">
      <div className="cookie-banner-card">
        <p id="cookie-banner-title" className="font-display text-[16px] font-semibold">
          Cookies
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink/70">
          We use strictly necessary cookies to run Dozen: login, security, and
          checkout. No ads or analytics.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-primary min-h-9 px-4 text-[13px]" onClick={accept}>
            OK
          </button>
          <Link href="/cookies" className="text-[13px] text-blue">
            Cookie notice
          </Link>
        </div>
      </div>
    </div>
  );
}
