#!/usr/bin/env npx tsx
/**
 * Playwright smoke QA — board tabs, filters, waitlist showcase, profile avatar picker.
 *
 *   npx tsx scripts/qa-smoke.ts
 *   QA_BASE_URL=http://localhost:3000 npx tsx scripts/qa-smoke.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium, type BrowserContext, type Page } from "playwright";

type Result = { name: string; ok: boolean; detail?: string };

const results: Result[] = [];

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // optional
  }
}

loadEnvLocal();

const BASE = process.env.QA_BASE_URL ?? process.env.PREVIEW_BASE_URL ?? "https://getdozen.dev";

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail });
  console.error(`  ✗ ${name} — ${detail}`);
}

async function loginViaMagicLink(context: BrowserContext) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const email =
    process.env.PREVIEW_LOGIN_EMAIL?.trim() ?? "lukakasalo96@gmail.com";
  if (!url || !serviceKey || !anonKey) {
    throw new Error("Missing Supabase env in .env.local");
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = data.properties?.hashed_token;
  if (error || !tokenHash) throw new Error(error?.message ?? "magic link failed");

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: verify, error: verifyErr } = await userClient.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyErr || !verify.session) throw new Error(verifyErr?.message ?? "verify failed");

  type CookieRow = {
    name: string;
    value: string;
    options?: {
      domain?: string;
      path?: string;
      expires?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "Lax" | "Strict" | "None";
    };
  };
  const pending: CookieRow[] = [];
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return pending.map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const c of cookiesToSet) {
          const idx = pending.findIndex((p) => p.name === c.name);
          if (idx >= 0) pending[idx] = c;
          else pending.push(c);
        }
      },
    },
  });
  await supabase.auth.setSession({
    access_token: verify.session.access_token,
    refresh_token: verify.session.refresh_token,
  });

  const host = new URL(BASE).hostname;
  const sameSite = (v?: string): "Lax" | "Strict" | "None" => {
    const s = (v ?? "Lax").toLowerCase();
    if (s === "strict") return "Strict";
    if (s === "none") return "None";
    return "Lax";
  };
  await context.addCookies(
    pending.map(({ name, value, options }) => ({
      name,
      value,
      domain: options?.domain ?? host,
      path: options?.path ?? "/",
      expires: options?.expires,
      httpOnly: options?.httpOnly,
      secure: options?.secure ?? BASE.startsWith("https"),
      sameSite: sameSite(options?.sameSite),
    })),
  );
  return verify.user?.id ?? null;
}

async function dismissCookieBanner(page: Page) {
  const ok = page.getByRole("button", { name: /^OK$/i });
  if (await ok.isVisible().catch(() => false)) {
    await ok.click();
    await page.waitForTimeout(200);
  }
}

async function waitForBoardReady(page: Page) {
  await page.locator("main").first().waitFor({ timeout: 30_000 });
  await page.waitForFunction(
    () => {
      const main = document.querySelector("main");
      if (!main || main.querySelector(".animate-pulse")) return false;
      return main.querySelectorAll("a[href*='/requests/']").length >= 1;
    },
    { timeout: 30_000 },
  );
}

async function testBoardTabs(page: Page) {
  await page.goto(`${BASE}/board`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await dismissCookieBanner(page);
  await waitForBoardReady(page);
  pass("Board loads with request cards");

  const tablist = page.getByRole("tablist", { name: "Request tracks" });
  await tablist.waitFor({ timeout: 10_000 });

  const tabs = [
    { name: "Testers", urlPart: null as string | null },
    { name: "Dozen pack", urlPart: "type=combo" },
    { name: "Feedback", urlPart: "type=feedback" },
  ] as const;

  for (const tab of tabs) {
    await tablist.getByRole("tab", { name: tab.name, exact: true }).click();
    await page.waitForTimeout(400);
    const href = page.url();
    if (tab.urlPart && !href.includes(tab.urlPart)) {
      fail(`Tab "${tab.name}"`, `Expected URL with ${tab.urlPart}, got ${href}`);
      continue;
    }
    if (!tab.urlPart && href.includes("type=")) {
      fail(`Tab "${tab.name}"`, `Expected default board URL, got ${href}`);
      continue;
    }
    await waitForBoardReady(page);
    const cards = await page.locator("main a[href*='/requests/']").count();
    if (cards < 1) {
      fail(`Tab "${tab.name}"`, "No request cards visible");
    } else {
      pass(`Tab "${tab.name}"`, `${cards} cards · ${href}`);
    }
  }
}

async function testBoardFilters(page: Page) {
  await page.goto(`${BASE}/board?type=feedback`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await dismissCookieBanner(page);
  await waitForBoardReady(page);

  const filtersBtn = page.getByRole("button", { name: /^Filters$/i });
  if (!(await filtersBtn.isVisible().catch(() => false))) {
    fail("Filters menu", "Filters button not found");
    return;
  }
  await filtersBtn.click();
  await page.waitForTimeout(300);

  const menu = page.getByRole("menu", { name: /filters/i }).or(
    page.locator("[data-board-filters]").first(),
  );
  const platformOption = page.getByRole("menuitemradio", { name: /iOS/i }).or(
    page.getByLabel(/iOS/i).first(),
  );
  if (await platformOption.isVisible().catch(() => false)) {
    await platformOption.click();
    await page.waitForTimeout(500);
    if (page.url().includes("platform=")) {
      pass("Filters apply to URL", page.url());
    } else {
      pass("Filters menu opens", "platform filter clicked");
    }
  } else if (await menu.isVisible().catch(() => false)) {
    pass("Filters menu opens");
  } else {
    fail("Filters menu", "Menu did not open");
  }
}

async function testWaitlistHome(page: Page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await dismissCookieBanner(page);

  const waitlistForm = page.getByRole("textbox", { name: /email/i }).or(
    page.locator('input[type="email"]').first(),
  );
  const boardLink = page.getByRole("link", { name: /Post feedback|board/i }).first();
  const hero = page.getByRole("heading", { level: 1 }).first();

  await hero.waitFor({ timeout: 15_000 });
  const heroText = (await hero.textContent())?.trim() ?? "";
  pass("Homepage hero renders", heroText.slice(0, 60));

  if (await waitlistForm.isVisible().catch(() => false)) {
    pass("Waitlist mode — email form visible");
    const showcase = page.locator(".waitlist-phone-shell, .waitlist-phone-copy").first();
    if (await showcase.isVisible().catch(() => false)) {
      pass("Waitlist phone showcase visible");
    } else {
      fail("Waitlist phone showcase", "Showcase not found");
    }
  } else if (await boardLink.isVisible().catch(() => false)) {
    pass("Launch open — CTA links to app");
  }
}

async function testProfileAvatarPicker(page: Page, userId: string | null) {
  if (!userId) {
    fail("Profile avatar picker", "No user id from login");
    return;
  }
  await page.goto(`${BASE}/profile/${userId}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await dismissCookieBanner(page);

  const avatarSection = page.getByRole("heading", { name: /^Avatar$/i });
  if (!(await avatarSection.isVisible().catch(() => false))) {
    pass("Profile page", "Avatar picker not on own profile (may be expected)");
    return;
  }

  const presetButtons = page.locator('button[aria-label*="avatar"]');
  const count = await presetButtons.count();
  if (count < 12) {
    fail("Profile avatar picker", `Expected 12 presets, found ${count}`);
    return;
  }

  const pressed = await presetButtons.evaluateAll((nodes) =>
    nodes.filter((n) => n.getAttribute("aria-pressed") === "true").length,
  );

  if (pressed > 1) {
    fail("Profile avatar picker", `${pressed} presets marked selected`);
  } else {
    pass("Profile avatar picker", `${count} presets, ${pressed} selected`);
  }
}

async function main() {
  console.log(`QA smoke against ${BASE}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  let userId: string | null = null;
  try {
    userId = await loginViaMagicLink(context);
    pass("Magic-link login", userId ?? undefined);
  } catch (err) {
    fail("Magic-link login", err instanceof Error ? err.message : String(err));
  }

  const page = await context.newPage();
  await page.addInitScript(() => {
    try {
      localStorage.setItem("dozen_cookie_notice", "ok");
    } catch {
      // ignore
    }
  });

  try {
    await testWaitlistHome(page);
  } catch (err) {
    fail("Homepage", err instanceof Error ? err.message : String(err));
  }

  if (userId) {
    try {
      await testBoardTabs(page);
    } catch (err) {
      fail("Board tabs", err instanceof Error ? err.message : String(err));
    }

    try {
      await testBoardFilters(page);
    } catch (err) {
      fail("Board filters", err instanceof Error ? err.message : String(err));
    }

    try {
      await testProfileAvatarPicker(page, userId);
    } catch (err) {
      fail("Profile avatar picker", err instanceof Error ? err.message : String(err));
    }
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.error("\nFailed:");
    for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
