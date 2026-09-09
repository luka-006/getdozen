#!/usr/bin/env npx tsx
/** Capture waitlist 3D showcase screenshot. Requires dev server on QA_BASE_URL. */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const OUT = resolve(process.cwd(), "marketing/frames/waitlist-3d-preview.png");

async function main() {
  mkdirSync(resolve(process.cwd(), "marketing/frames"), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector(".waitlist-3d-scene", { timeout: 15_000 });
  await page.waitForFunction(
    () => {
      const imgs = document.querySelectorAll(".waitlist-phone-shot");
      return (
        imgs.length >= 4 &&
        [...imgs].every((img) => (img as HTMLImageElement).naturalWidth > 0)
      );
    },
    { timeout: 20_000 },
  );
  await page.waitForTimeout(400);

  const showcase = page.locator(".waitlist-phone-showcase").first();
  await showcase.screenshot({ path: OUT });
  await browser.close();
  console.log(`Wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
