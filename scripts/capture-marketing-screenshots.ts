#!/usr/bin/env npx tsx
/**
 * Capture marketing screenshots (phone + desktop).
 * Uses live prod when Supabase creds exist; otherwise static mockups.
 *
 *   npx tsx scripts/capture-marketing-screenshots.ts
 *   MARKETING_OUT_DIR=/path/to/media/screenshots npx tsx scripts/capture-marketing-screenshots.ts
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type BrowserContext, type Page } from "playwright";
import { loginPreviewContext } from "./lib/preview-auth";
import { loadEnvLocal, previewBaseUrl } from "./lib/script-env";

loadEnvLocal();

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };
const MOCK_DIR = resolve(process.cwd(), "marketing/mockups");
const STORE_OUT =
  process.env.MARKETING_OUT_DIR?.trim() ??
  resolve(
    process.cwd(),
    "../cursor/stores/bc-09c7c829-8890-4733-97e5-51250955c098/media/screenshots",
  );
const PUBLIC_OUT = resolve(process.cwd(), "public/marketing/screenshots");
const BASE = previewBaseUrl();

const FOCUS_FLOW_ID = "6383baa2-a5da-4249-b3be-0d88bdb8432c";
const CAMPFIRE_REVIEW_ID = "dc445fac-af62-4183-ab24-15088ba67fae";

type Shot = {
  file: string;
  mode: "mock" | "live";
  mock?: string;
  path?: string;
  viewport: "mobile" | "desktop";
  waitFor?: "board" | "request" | "review" | "public";
};

const SHOTS: Shot[] = [
  {
    file: "home-mobile.png",
    mode: "live",
    path: "/",
    viewport: "mobile",
    waitFor: "public",
    mock: "home-mobile.html",
  },
  {
    file: "home-desktop.png",
    mode: "live",
    path: "/",
    viewport: "desktop",
    waitFor: "public",
    mock: "home-desktop.html",
  },
  {
    file: "board-feedback-mobile.png",
    mode: "live",
    path: "/board?type=feedback",
    viewport: "mobile",
    waitFor: "board",
    mock: "m-feedback.html",
  },
  {
    file: "board-testers-mobile.png",
    mode: "live",
    path: "/board?type=tester",
    viewport: "mobile",
    waitFor: "board",
    mock: "board-testers.html",
  },
  {
    file: "request-detail-mobile.png",
    mode: "live",
    path: `/requests/${FOCUS_FLOW_ID}`,
    viewport: "mobile",
    waitFor: "request",
    mock: "request-detail.html",
  },
  {
    file: "review-form-mobile.png",
    mode: "live",
    path: `/requests/${CAMPFIRE_REVIEW_ID}/review`,
    viewport: "mobile",
    waitFor: "review",
    mock: "review-form.html",
  },
  {
    file: "profile-mobile.png",
    mode: "mock",
    mock: "profile.html",
    viewport: "mobile",
  },
  {
    file: "wallet-mobile.png",
    mode: "mock",
    mock: "wallet.html",
    viewport: "mobile",
  },
  {
    file: "wall-mobile.png",
    mode: "live",
    path: "/wall",
    viewport: "mobile",
    waitFor: "public",
    mock: "wall.html",
  },
  {
    file: "board-feedback-desktop.png",
    mode: "mock",
    mock: "m-feedback.html",
    viewport: "desktop",
  },
];

function hasLiveAuth() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

async function dismissCookieBanner(page: Page) {
  const ok = page.getByRole("button", { name: /^OK$/i });
  if (await ok.isVisible().catch(() => false)) {
    await ok.click();
    await page.waitForTimeout(180);
  }
}

async function waitForReady(page: Page, kind: Shot["waitFor"]) {
  if (!kind || kind === "public") {
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    return;
  }
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
  await page.waitForTimeout(450);
}

async function captureMock(page: Page, mockFile: string, outPath: string, viewport: "mobile" | "desktop") {
  const size = viewport === "mobile" ? MOBILE : DESKTOP;
  await page.setViewportSize(size);
  await page.goto(pathToFileURL(resolve(MOCK_DIR, mockFile)).href, {
    waitUntil: "load",
    timeout: 30_000,
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: outPath, fullPage: false });
}

async function captureLive(
  page: Page,
  shot: Shot,
  outPath: string,
) {
  const size = shot.viewport === "mobile" ? MOBILE : DESKTOP;
  await page.setViewportSize(size);
  await page.goto(`${BASE}${shot.path}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await dismissCookieBanner(page);
  await waitForReady(page, shot.waitFor);
  await page.screenshot({ path: outPath, fullPage: false });
}

async function writeShot(
  page: Page,
  context: BrowserContext | null,
  shot: Shot,
  outDir: string,
) {
  const outPath = resolve(outDir, shot.file);
  const useLive = shot.mode === "live" && hasLiveAuth() && shot.path;

  try {
    if (useLive && context) {
      await captureLive(page, shot, outPath);
      console.log(`  live  ${shot.file}`);
      return;
    }
  } catch (err) {
    console.warn(`  live failed ${shot.file}: ${err instanceof Error ? err.message : err}`);
  }

  const mock = shot.mock ?? shot.mock;
  if (!mock) throw new Error(`No mock fallback for ${shot.file}`);
  await captureMock(page, mock, outPath, shot.viewport);
  console.log(`  mock  ${shot.file}`);
}

async function main() {
  for (const dir of [STORE_OUT, PUBLIC_OUT]) {
    mkdirSync(dir, { recursive: true });
  }

  const live = hasLiveAuth();
  console.log(`Capture mode: ${live ? "live prod (with mock fallback)" : "mock HTML only"}`);
  console.log(`Store → ${STORE_OUT}`);
  console.log(`Public → ${PUBLIC_OUT}`);

  const browser = await chromium.launch({ headless: true });
  let context: BrowserContext | null = null;

  if (live) {
    context = await browser.newContext({
      viewport: MOBILE,
      isMobile: true,
      hasTouch: true,
    });
    await loginPreviewContext(context);
    await context.addInitScript(() => {
      try {
        localStorage.setItem("dozen_cookie_notice", "ok");
      } catch {
        // ignore
      }
    });
  }

  const page = context
    ? await context.newPage()
    : await browser.newPage({ viewport: MOBILE, deviceScaleFactor: 2 });

  for (const dir of [STORE_OUT, PUBLIC_OUT]) {
    console.log(`\n→ ${dir}`);
    for (const shot of SHOTS) {
      await writeShot(page, context, shot, dir);
    }
  }

  await browser.close();
  console.log(`\nWrote ${SHOTS.length} screenshots × 2 destinations`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
