#!/usr/bin/env npx tsx
/**
 * Screenshot static UI mockups → public/marketing/waitlist/*.png
 * No Supabase auth required (offline marketing assets).
 *
 *   npx tsx scripts/capture-marketing-mockups.ts
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const MOBILE_W = 390;
const MOBILE_H = 844;
const MOCK_DIR = resolve(process.cwd(), "marketing/mockups");
const OUT_DIR = resolve(process.cwd(), "public/marketing/waitlist");

const SHOTS = [
  { src: "board-testers.html", out: "board-testers.png" },
  { src: "request-detail.html", out: "request-detail.png" },
  { src: "review-form.html", out: "review-form.png" },
];

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: MOBILE_W, height: MOBILE_H },
    deviceScaleFactor: 2,
  });

  for (const shot of SHOTS) {
    const fileUrl = pathToFileURL(resolve(MOCK_DIR, shot.src)).href;
    await page.goto(fileUrl, { waitUntil: "load", timeout: 30_000 });
    await page.waitForTimeout(300);
    const out = resolve(OUT_DIR, shot.out);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`Wrote ${out}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
