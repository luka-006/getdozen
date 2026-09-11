#!/usr/bin/env npx tsx
/**
 * Capture mobile screenshots for the waitlist phone showcase.
 * Writes PNGs to public/marketing/waitlist/ (served at /marketing/waitlist/*.png).
 *
 * Requires .env.local with Supabase keys + PREVIEW_LOGIN_EMAIL.
 *
 *   npx tsx scripts/capture-waitlist-phones.ts
 *   PREVIEW_BASE_URL=https://getdozen.dev npx tsx scripts/capture-waitlist-phones.ts
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Page } from "playwright";
import { loginPreviewContext } from "./lib/preview-auth";
import { loadEnvLocal, previewBaseUrl } from "./lib/script-env";

/** Prod demo request IDs (match scripts/generate-launch-video.ts). */
const FOCUS_FLOW_ID = "6383baa2-a5da-4249-b3be-0d88bdb8432c";
const CAMPFIRE_REVIEW_ID = "dc445fac-af62-4183-ab24-15088ba67fae";

const MOBILE_W = 390;
const MOBILE_H = 844;

const SHOTS: { file: string; path: string; waitFor: "board" | "request" | "review" }[] = [
  { file: "board-testers.png", path: "/board?type=tester", waitFor: "board" },
  { file: "request-detail.png", path: `/requests/${FOCUS_FLOW_ID}`, waitFor: "request" },
  {
    file: "review-form.png",
    path: `/requests/${CAMPFIRE_REVIEW_ID}/review`,
    waitFor: "review",
  },
];

loadEnvLocal();
const BASE = previewBaseUrl();
const OUT_DIR = resolve(process.cwd(), "public/marketing/waitlist");

async function dismissCookieBanner(page: Page) {
  const ok = page.getByRole("button", { name: /^OK$/i });
  if (await ok.isVisible().catch(() => false)) {
    await ok.click();
    await page.waitForTimeout(180);
  }
}

async function waitForReady(page: Page, kind: "board" | "request" | "review") {
  await page.locator("main").first().waitFor({ timeout: 45_000 });
  if (kind === "review") {
    await page.locator("main textarea, main form label").first().waitFor({
      timeout: 45_000,
    });
  } else if (kind === "request") {
    await page.locator("main h1").first().waitFor({ timeout: 45_000 });
  } else {
    await page.waitForFunction(
      () => {
        const main = document.querySelector("main");
        if (!main || main.querySelector(".animate-pulse")) return false;
        const cards = main.querySelectorAll("a[href*='/requests/']");
        return cards.length >= 2;
      },
      { timeout: 45_000 },
    );
  }
  await page.waitForTimeout(500);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: MOBILE_W, height: MOBILE_H },
    isMobile: true,
    hasTouch: true,
  });
  await loginPreviewContext(context);
  const page = await context.newPage();
  await page.addInitScript(() => {
    try {
      localStorage.setItem("dozen_cookie_notice", "ok");
    } catch {
      // ignore
    }
  });

  for (const shot of SHOTS) {
    await page.goto(`${BASE}${shot.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await dismissCookieBanner(page);
    await waitForReady(page, shot.waitFor);
    const out = resolve(OUT_DIR, shot.file);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`Wrote ${out}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
