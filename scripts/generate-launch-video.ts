#!/usr/bin/env npx tsx
/**
 * Dozen vertical launch video (9:16) — phone left, animated captions right.
 *
 *   npx tsx scripts/generate-launch-video.ts
 *   npx tsx scripts/generate-launch-video.ts --skip-capture
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium, type BrowserContext, type Page } from "playwright";

const TOTAL_SEC = 14;
const FPS = 30;
/** 9:16 — TikTok, Reels, Stories, waitlist vertical */
const OUT_W = 1080;
const OUT_H = 1920;
const FADE_SEC = 0.25;
const KINETIC_BEAT_SEC = 0.8;
const MOBILE_W = 390;
const MOBILE_H = 844;
const FOCUS_FLOW_ID = "6383baa2-a5da-4249-b3be-0d88bdb8432c";
const CAMPFIRE_REVIEW_ID = "dc445fac-af62-4183-ab24-15088ba67fae";

type PhoneScene = {
  slug: string;
  kind: "intro" | "phone" | "outro";
  transition: "fade" | "smoothright" | "smoothleft";
  mobileSlug?: string;
  appPath?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  scroll?: number;
  /** Seconds to skip at start of raw mobile capture (first clip needs more). */
  trimStart?: number;
  /** Extra ms after content ready before scroll begins. */
  settleMs?: number;
};

const SEGMENTS: PhoneScene[] = [
  { slug: "01-intro", kind: "intro", transition: "fade" },
  {
    slug: "02-feedback",
    kind: "phone",
    transition: "smoothright",
    mobileSlug: "m-feedback",
    appPath: "/board?type=feedback",
    eyebrow: "Feedback board",
    title: "Give real feedback",
    description: "Test apps and games — thoughtful answers earn Dots.",
    scroll: 580,
    trimStart: 5.6,
    settleMs: 900,
  },
  {
    slug: "03-testers",
    kind: "phone",
    transition: "smoothleft",
    mobileSlug: "m-testers",
    appPath: "/board?type=tester",
    eyebrow: "Tester runs",
    title: "Test for 14 days",
    description: "Opt in once. Check in every few days. No chaos DMs.",
    scroll: 540,
  },
  {
    slug: "04-request",
    kind: "phone",
    transition: "smoothright",
    mobileSlug: "m-request",
    appPath: `/requests/${FOCUS_FLOW_ID}`,
    eyebrow: "Live progress",
    title: "Track your test run",
    description: "Check-ins, ratings, and tester slots — all in one place.",
    scroll: 500,
  },
  {
    slug: "05-review",
    kind: "phone",
    transition: "smoothleft",
    mobileSlug: "m-review",
    appPath: `/requests/${CAMPFIRE_REVIEW_ID}/review`,
    eyebrow: "Earn Dots",
    title: "Quality feedback pays",
    description: "Structured reviews beat one-liners. Testers earn, makers ship.",
    scroll: 460,
  },
  { slug: "06-outro", kind: "outro", transition: "fade" },
];

/** Phone screen window on 1080×1920 canvas (left side). */
const PHONE_SCREEN = { x: 58, y: 368, w: 364, h: 788 };

const MOBILE_TRIM_START = 2.35;
/** Extra raw capture before trim so only the showcase remains. */
const MOBILE_RAW_PAD_SEC = 1.2;

const MOTTO = {
  introLine1: "Test. Earn. Feedback.",
  introLine2: "Apps & games · 12 testers · 14 days",
  outroCta: "Create your account",
  outroSub: "Test apps. Earn Dots. Give feedback.",
};

const CLIP_SEC = (TOTAL_SEC + (SEGMENTS.length - 1) * FADE_SEC) / SEGMENTS.length;

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

const BASE = process.env.PREVIEW_BASE_URL ?? "https://getdozen.dev";
const OUT_DIR = resolve(process.cwd(), "marketing");
const CLIPS_DIR = resolve(OUT_DIR, "clips");
const VIDEO_PATH = resolve(OUT_DIR, "dozen-launch-preview.mp4");
const HORIZONTAL_PATH = resolve(OUT_DIR, "dozen-launch-horizontal.mp4");
const VOICEOVER_PATH = resolve(CLIPS_DIR, "voiceover.mp3");
const PUBLIC_DIR = resolve(process.cwd(), "public/marketing");
const STORE_VIDEO_DIR =
  process.env.STORE_VIDEO_DIR ??
  "/cursor/stores/bc-09c7c829-8890-4733-97e5-51250955c098/media/videos";
const SKIP_CAPTURE = process.argv.includes("--skip-capture");
const COMPOSE_ONLY = process.argv.includes("--compose-only");
const MOCK_CAPTURE = process.argv.includes("--mock");
const MOCK_DIR = resolve(process.cwd(), "marketing/mockups");

function resolveFfmpeg(): string {
  const mod = require("ffmpeg-static");
  const p = typeof mod === "string" ? mod : mod?.default;
  if (p && existsSync(p)) return p as string;
  throw new Error("Run: npm i -D ffmpeg-static playwright");
}

function runFfmpeg(ffmpegBin: string, args: string[]) {
  const r = spawnSync(ffmpegBin, args, {
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024,
  });
  if (r.status !== 0) {
    console.error(r.stderr?.slice(-5000));
    process.exit(1);
  }
}

function probeDuration(ffmpegBin: string, file: string): number | null {
  const probe = spawnSync(ffmpegBin, ["-i", file, "-f", "null", "-"], {
    encoding: "utf8",
  });
  const m = probe.stderr?.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

async function loginViaMagicLink(context: BrowserContext) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const email =
    process.env.PREVIEW_LOGIN_EMAIL?.trim() ?? "lukakasalo96@gmail.com";
  if (!url || !serviceKey || !anonKey) return;

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = data.properties?.hashed_token;
  if (error || !tokenHash) return;

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: verify, error: verifyErr } = await userClient.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyErr || !verify.session) return;

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
  console.log(`Logged in as ${email}`);
}

async function smoothScroll(page: Page, deltaY: number, steps = 30) {
  const step = deltaY / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step);
    await page.waitForTimeout(10);
  }
}

/** Multi-phase scroll — feels alive, not a single slow drag. */
async function showcaseScroll(page: Page, totalDown: number) {
  await smoothScroll(page, totalDown * 0.55, 26);
  await page.waitForTimeout(180);
  await smoothScroll(page, totalDown * 0.35, 22);
  await page.waitForTimeout(160);
  await smoothScroll(page, -totalDown * 0.12, 14);
  await page.waitForTimeout(140);
  await smoothScroll(page, totalDown * 0.1, 12);
}

async function waitForAppReady(page: Page, appPath: string) {
  await page.locator("main").first().waitFor({ timeout: 45_000 });
  if (appPath.includes("/review")) {
    await page.locator("main textarea, main form label").first().waitFor({ timeout: 45_000 });
  } else if (appPath.includes("/requests/")) {
    await page.locator("main h1").first().waitFor({ timeout: 45_000 });
  } else {
    await page.waitForFunction(
      () => {
        const main = document.querySelector("main");
        if (!main || main.querySelector(".animate-pulse")) return false;
        const cards = main.querySelectorAll("a[href*='/requests/']");
        if (cards.length < 2) return false;
        const first = cards[0] as HTMLElement | undefined;
        return Boolean(first && first.getBoundingClientRect().height > 24);
      },
      { timeout: 45_000 },
    );
  }
  await page
    .waitForFunction(
      () => !document.querySelector("main .animate-pulse"),
      { timeout: 20_000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(450);
}

async function warmupMobileSession(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  authContext: BrowserContext,
) {
  const ctx = await browser.newContext({
    viewport: { width: MOBILE_W, height: MOBILE_H },
    isMobile: true,
    hasTouch: true,
    storageState: await authContext.storageState(),
  });
  const page = await ctx.newPage();
  await page.addInitScript((key) => {
    try {
      localStorage.setItem(key, "ok");
    } catch {
      // ignore
    }
  }, "dozen_cookie_notice");
  await goto(page, "/board?type=feedback");
  await dismissCookieBanner(page);
  await waitForAppReady(page, "/board?type=feedback");
  await ctx.close();
  console.log("  warmed mobile session");
}

function introHtml(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${OUT_W}px;height:${OUT_H}px;overflow:hidden}
  body{display:flex;align-items:center;justify-content:center;
    background:radial-gradient(900px 700px at 50% 25%,#dbeafe 0%,#f4f6fb 42%,#e8ecf4 100%);
    font-family:system-ui,-apple-system,sans-serif;animation:bgDrift ${CLIP_SEC}s ease-in-out infinite alternate}
  .glow{position:absolute;width:520px;height:520px;border-radius:50%;background:#2563eb28;
    filter:blur(70px);animation:glowDrift ${CLIP_SEC}s ease-in-out infinite alternate}
  .wrap{text-align:center;position:relative;z-index:1;padding:0 48px;
    animation:wrapFloat ${CLIP_SEC}s ease-in-out infinite alternate}
  .logo{font-size:108px;font-weight:900;letter-spacing:-0.05em;color:#0b1f3a;
    animation:rise 0.55s cubic-bezier(0.22,1,0.36,1) both, logoPulse ${CLIP_SEC}s 0.55s ease-in-out infinite alternate}
  .tag{margin-top:22px;font-size:40px;font-weight:800;color:#0b1f3a;line-height:1.15;
    animation:rise 0.5s 0.15s cubic-bezier(0.22,1,0.36,1) both, slideTag ${CLIP_SEC}s 0.65s ease-in-out infinite alternate}
  .sub{margin-top:16px;font-size:24px;font-weight:500;color:#64748b;
    animation:rise 0.45s 0.28s cubic-bezier(0.22,1,0.36,1) both}
  .pill{display:inline-block;margin-top:32px;padding:14px 28px;border-radius:999px;
    background:#1e4fd8;color:#fff;font-size:18px;font-weight:600;
    animation:rise 0.4s 0.4s cubic-bezier(0.22,1,0.36,1) both, pillPulse ${CLIP_SEC}s 0.8s ease-in-out infinite alternate}
  @keyframes rise{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
  @keyframes bgDrift{from{background-position:50% 25%}to{background-position:52% 28%}}
  @keyframes glowDrift{from{transform:translate(-18px,-12px) scale(1)}to{transform:translate(22px,16px) scale(1.12)}}
  @keyframes wrapFloat{from{transform:translateY(0)}to{transform:translateY(-10px)}}
  @keyframes logoPulse{from{transform:scale(1)}to{transform:scale(1.03)}}
  @keyframes slideTag{from{transform:translateX(-8px)}to{transform:translateX(8px)}}
  @keyframes pillPulse{from{transform:scale(1);box-shadow:0 0 0 #1e4fd800}to{transform:scale(1.04);box-shadow:0 0 32px #1e4fd855}}
  </style></head><body>
  <div class="glow"></div>
  <div class="wrap">
    <div class="logo">Dozen</div>
    <div class="tag">${MOTTO.introLine1}</div>
    <div class="sub">${MOTTO.introLine2}</div>
    <div class="pill">getdozen.dev</div>
  </div></body></html>`;
}

function outroHtml(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${OUT_W}px;height:${OUT_H}px;overflow:hidden}
  body{display:flex;align-items:center;justify-content:center;text-align:center;
    background:linear-gradient(165deg,#1e3a8a 0%,#1e4fd8 45%,#3b82f6 100%);
    font-family:system-ui,-apple-system,sans-serif;color:#fff;
    animation:gradShift ${CLIP_SEC}s ease-in-out infinite alternate}
  .wrap{animation:wrapDrift ${CLIP_SEC}s ease-in-out infinite alternate}
  .url{font-size:72px;font-weight:900;letter-spacing:-0.03em;
    animation:rise 0.55s cubic-bezier(0.22,1,0.36,1) both, urlPulse ${CLIP_SEC}s 0.55s ease-in-out infinite alternate}
  .cta{margin-top:22px;font-size:32px;font-weight:500;opacity:.95;
    animation:rise 0.5s 0.2s cubic-bezier(0.22,1,0.36,1) both, ctaSlide ${CLIP_SEC}s 0.7s ease-in-out infinite alternate}
  .sub{margin-top:14px;font-size:18px;opacity:.75;animation:rise 0.45s 0.35s cubic-bezier(0.22,1,0.36,1) both}
  @keyframes rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
  @keyframes gradShift{from{background-position:0% 50%}to{background-position:100% 50%}}
  @keyframes wrapDrift{from{transform:translateY(0) scale(1)}to{transform:translateY(-8px) scale(1.02)}}
  @keyframes urlPulse{from{transform:scale(1)}to{transform:scale(1.04)}}
  @keyframes ctaSlide{from{transform:translateX(-10px)}to{transform:translateX(10px)}}
  </style></head><body>
  <div class="wrap"><div class="url">getdozen.dev</div><div class="cta">${MOTTO.outroCta}</div>
  <div class="sub">${MOTTO.outroSub}</div></div></body></html>`;
}

async function goto(page: Page, path: string) {
  await page.goto(`${BASE}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.locator("main").first().waitFor({ timeout: 30_000 }).catch(() => undefined);
}

async function dismissCookieBanner(page: Page) {
  const ok = page.getByRole("button", { name: /^OK$/i });
  if (await ok.isVisible().catch(() => false)) {
    await ok.click();
    await page.waitForTimeout(180);
  }
}

function assTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}:${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
}

function assEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function kineticAssLine(
  startSec: number,
  endSec: number,
  style: string,
  text: string,
  slideFrom: number,
): string {
  const start = assTime(startSec);
  const end = assTime(endSec);
  const durMs = Math.round((endSec - startSec) * 1000);
  const fadeIn = Math.min(220, durMs);
  const fadeOut = Math.min(180, durMs);
  const xFrom = slideFrom;
  const xTo = 0;
  return `Dialogue: 0,${start},${end},${style},,0,0,0,,{\\fad(${fadeIn},${fadeOut})\\move(${520 + xFrom},820,520,820,0,${durMs})\\t(0,${durMs},\\fscx100\\fscy100)}${text}`;
}

function writeAssCaption(seg: PhoneScene, path: string) {
  const eyebrow = assEscape((seg.eyebrow ?? "").toUpperCase());
  const title = assEscape(seg.title ?? "");
  const desc = assEscape(seg.description ?? "");
  const beats = [
    { t0: 0.05, t1: Math.min(CLIP_SEC, 0.05 + KINETIC_BEAT_SEC), style: "Eyebrow", text: eyebrow, slide: -36 },
    {
      t0: 0.05 + KINETIC_BEAT_SEC * 0.5,
      t1: Math.min(CLIP_SEC, 0.05 + KINETIC_BEAT_SEC * 1.5),
      style: "Title",
      text: title,
      slide: 42,
    },
    {
      t0: 0.05 + KINETIC_BEAT_SEC,
      t1: CLIP_SEC,
      style: "Desc",
      text: desc,
      slide: -28,
    },
  ];
  const events = beats
    .map((b) => kineticAssLine(b.t0, b.t1, b.style, b.text, b.slide))
    .join("\n");
  const content = `[Script Info]
ScriptType: v4.00+
PlayResX: ${OUT_W}
PlayResY: ${OUT_H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Eyebrow,Arial,28,&H00D84F1E,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,520,80,760,1
Style: Title,Arial,46,&H000B1F3A,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,7,520,80,820,1
Style: Desc,Arial,26,&H00475669,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,520,80,940,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events}
`;
  writeFileSync(path, content, "utf8");
}

function phoneFrameHtml(): string {
  const { x, y, w, h } = PHONE_SCREEN;
  const pad = 12;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${OUT_W}px;height:${OUT_H}px;background:transparent;perspective:1400px}
  .rig{position:absolute;left:0;top:0;width:${OUT_W}px;height:${OUT_H}px;
    transform-style:preserve-3d;animation:phoneDrift ${CLIP_SEC}s ease-in-out infinite alternate}
  .device{position:absolute;left:${x - pad - 8}px;top:${y - pad - 28}px;
    width:${w + pad * 2 + 16}px;height:${h + pad * 2 + 36}px;transform-origin:50% 60%}
  .frame{position:absolute;inset:0;border-radius:44px;border:12px solid #141416;
    background:linear-gradient(145deg,#2a2a2e,#0f0f12 55%,#1a1a1f);
    box-shadow:inset 0 1px 0 #ffffff30,0 50px 100px #0b1f3a45,0 12px 32px #0b1f3a25}
  .shine{position:absolute;inset:12px;border-radius:32px;
    background:linear-gradient(125deg,#ffffff18 0%,transparent 42%,transparent 100%);
    pointer-events:none}
  .notch{position:absolute;left:50%;top:10px;transform:translateX(-50%);
    width:108px;height:26px;background:#141416;border-radius:14px;z-index:2}
  @keyframes phoneDrift{
    from{transform:rotateY(-10deg) rotateX(5deg) translateY(0)}
    to{transform:rotateY(10deg) rotateX(-4deg) translateY(-10px)}
  }
  </style></head><body>
  <div class="rig"><div class="device"><div class="frame"></div><div class="shine"></div><div class="notch"></div></div></div>
  </body></html>`;
}

async function ensurePhoneFrameClip(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
): Promise<string> {
  const clipPath = resolve(CLIPS_DIR, "phone-frame.webm");
  if (existsSync(clipPath)) return clipPath;

  const out = resolve(CLIPS_DIR, "phone-frame.webm");
  if (existsSync(out)) unlinkSync(out);

  const ctx = await browser.newContext({
    viewport: { width: OUT_W, height: OUT_H },
    recordVideo: { dir: CLIPS_DIR, size: { width: OUT_W, height: OUT_H } },
  });
  const page = await ctx.newPage();
  await page.setContent(phoneFrameHtml(), { waitUntil: "load" });
  await page.waitForTimeout(CLIP_SEC * 1000);
  const video = page.video();
  await ctx.close();
  if (!video) throw new Error("No phone frame recording");
  renameSync(await video.path(), out);
  console.log("  phone frame (animated)");
  return out;
}

async function recordMockMobileClip(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  seg: PhoneScene,
) {
  const slug = seg.mobileSlug!;
  const out = resolve(CLIPS_DIR, `${slug}.webm`);
  if (existsSync(out)) unlinkSync(out);

  const mockMap: Record<string, string> = {
    "m-feedback": "m-feedback.html",
    "m-testers": "board-testers.html",
    "m-request": "request-detail.html",
    "m-review": "review-form.html",
  };
  const mockFile = resolve(MOCK_DIR, mockMap[slug] ?? `${slug}.html`);
  const htmlPath = mockFile;
  if (!existsSync(htmlPath)) {
    throw new Error(`Mock HTML missing for ${slug} (tried ${mockFile})`);
  }

  const ctx = await browser.newContext({
    viewport: { width: MOBILE_W, height: MOBILE_H },
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir: CLIPS_DIR, size: { width: MOBILE_W, height: MOBILE_H } },
  });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(htmlPath).href, {
    waitUntil: "load",
    timeout: 30_000,
  });
  const holdMs = Math.max(
    4500,
    (CLIP_SEC + (MOCK_CAPTURE ? 0 : MOBILE_TRIM_START) + MOBILE_RAW_PAD_SEC) * 1000,
  );
  await page.waitForTimeout(holdMs);

  const video = page.video();
  await ctx.close();
  if (!video) throw new Error(`No mock mobile recording: ${slug}`);
  renameSync(await video.path(), out);
  console.log(`  mock mobile ${slug}`);
}

async function recordMobileClip(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  authContext: BrowserContext,
  seg: PhoneScene,
) {
  const slug = seg.mobileSlug!;
  const out = resolve(CLIPS_DIR, `${slug}.webm`);
  if (existsSync(out)) unlinkSync(out);

  const ctx = await browser.newContext({
    viewport: { width: MOBILE_W, height: MOBILE_H },
    isMobile: true,
    hasTouch: true,
    storageState: await authContext.storageState(),
    recordVideo: { dir: CLIPS_DIR, size: { width: MOBILE_W, height: MOBILE_H } },
  });
  const page = await ctx.newPage();
  await page.addInitScript((key) => {
    try {
      localStorage.setItem(key, "ok");
    } catch {
      // ignore
    }
  }, "dozen_cookie_notice");
  await goto(page, seg.appPath!);
  await dismissCookieBanner(page);
  await waitForAppReady(page, seg.appPath!);
  if (seg.settleMs) await page.waitForTimeout(seg.settleMs);
  await showcaseScroll(page, seg.scroll ?? 480);

  const trim = seg.trimStart ?? MOBILE_TRIM_START;
  const holdMs = (CLIP_SEC + trim + MOBILE_RAW_PAD_SEC) * 1000 - 2200;
  if (holdMs > 0) await page.waitForTimeout(holdMs);

  const video = page.video();
  await ctx.close();
  if (!video) throw new Error(`No mobile recording: ${slug}`);
  renameSync(await video.path(), out);
  console.log(`  mobile ${slug}`);
}

function composePhoneScene(ffmpegBin: string, seg: PhoneScene, frameClip: string) {
  const mobileWebm = resolve(CLIPS_DIR, `${seg.mobileSlug}.webm`);
  const out = resolve(CLIPS_DIR, `${seg.slug}.mp4`);
  const assPath = resolve(CLIPS_DIR, `${seg.slug}.ass`);
  writeAssCaption(seg, assPath);

  const { x, y, w, h } = PHONE_SCREEN;
  const assEsc = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");
  const dur = CLIP_SEC.toFixed(3);
  const trimStart = (MOCK_CAPTURE ? 0 : (seg.trimStart ?? MOBILE_TRIM_START)).toFixed(3);
  const trimDur = (CLIP_SEC + 0.4).toFixed(3);
  const kenFrames = Math.max(1, Math.ceil(CLIP_SEC * FPS));
  const appChain = [
    `trim=start=${trimStart}:duration=${trimDur}`,
    "setpts=PTS-STARTPTS",
    `fps=${FPS}`,
    `scale=${w}:${h}:force_original_aspect_ratio=increase`,
    `crop=${w}:${h}`,
    `zoompan=z='min(1.1,1+0.1*on/${kenFrames})':x='iw/2-(iw/zoom/2)+12*sin(on/8)':y='ih/2-(ih/zoom/2)+6*sin(on/11)':d=1:s=${w}x${h}:fps=${FPS}`,
  ].join(",");

  const filter = [
    `color=c=0xf4f6fb:s=${OUT_W}x${OUT_H}:d=${dur}:r=${FPS}[bg]`,
    `[0:v]${appChain}[app]`,
    `[bg][app]overlay=${x}:${y}:format=auto[layer1]`,
    `[1:v]scale=${OUT_W}:${OUT_H},loop=loop=-1:size=1:start=0,trim=duration=${dur},setpts=PTS-STARTPTS[frame]`,
    `[layer1][frame]overlay=0:0:format=auto[layer2]`,
    `[layer2]subtitles='${assEsc}',fps=${FPS}[vout]`,
  ].join(";");

  runFfmpeg(ffmpegBin, [
    "-y",
    "-i",
    mobileWebm,
    "-i",
    frameClip,
    "-filter_complex",
    filter,
    "-map",
    "[vout]",
    "-t",
    dur,
    "-vsync",
    "cfr",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-an",
    out,
  ]);
  console.log(`  compose ${seg.slug}`);
}

async function recordStudioPage(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  slug: string,
  html: string,
) {
  const out = resolve(CLIPS_DIR, `${slug}.webm`);
  if (existsSync(out)) unlinkSync(out);

  const ctx = await browser.newContext({
    viewport: { width: OUT_W, height: OUT_H },
    recordVideo: { dir: CLIPS_DIR, size: { width: OUT_W, height: OUT_H } },
  });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForTimeout(CLIP_SEC * 1000);

  const video = page.video();
  await ctx.close();
  if (!video) throw new Error(`No studio recording: ${slug}`);
  renameSync(await video.path(), out);
  console.log(`  studio ${slug}`);
}

async function recordAll(ffmpegBin: string) {
  mkdirSync(CLIPS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  if (MOCK_CAPTURE) {
    console.log("Recording mock mobile clips (no auth)…");
    for (const seg of SEGMENTS) {
      if (seg.kind === "phone") await recordMockMobileClip(browser, seg);
    }
  } else {
    const auth = await browser.newContext({
      viewport: { width: MOBILE_W, height: MOBILE_H },
      isMobile: true,
      hasTouch: true,
    });
    await loginViaMagicLink(auth);

    console.log("Recording authenticated mobile clips…");
    await warmupMobileSession(browser, auth);
    for (const seg of SEGMENTS) {
      if (seg.kind === "phone") await recordMobileClip(browser, auth, seg);
    }
    await auth.close();
  }

  console.log("Compositing phone scenes + intro/outro…");
  const frameClip = await ensurePhoneFrameClip(browser);
  for (const seg of SEGMENTS) {
    if (seg.kind === "phone") composePhoneScene(ffmpegBin, seg, frameClip);
  }
  await recordStudioPage(browser, "01-intro", introHtml());
  await recordStudioPage(browser, "06-outro", outroHtml());

  await browser.close();
}

function normalizeClip(ffmpegBin: string, input: string, output: string) {
  const ext = input.endsWith(".mp4") ? [] : ["-an"];
  const frames = Math.round(CLIP_SEC * FPS);
  runFfmpeg(ffmpegBin, [
    "-y",
    "-i",
    input,
    "-vf",
    [
      `scale=${OUT_W}:${OUT_H}:force_original_aspect_ratio=increase`,
      `crop=${OUT_W}:${OUT_H}`,
      "setsar=1",
      `fps=${FPS}`,
      `tpad=stop_mode=clone:stop_duration=0`,
    ].join(","),
    "-frames:v",
    String(frames),
    ...ext,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-vsync",
    "cfr",
    output,
  ]);
}

function segmentSource(slug: string): string {
  const mp4 = resolve(CLIPS_DIR, `${slug}.mp4`);
  if (existsSync(mp4)) return mp4;
  return resolve(CLIPS_DIR, `${slug}.webm`);
}

function voiceoverInputArgs(): string[] {
  if (!existsSync(VOICEOVER_PATH)) {
    console.warn(`No voiceover at ${VOICEOVER_PATH} — exporting silent video`);
    return [];
  }
  return ["-i", VOICEOVER_PATH];
}

function stitchMock(ffmpegBin: string) {
  const slugs = SEGMENTS.map((s) => s.slug);
  for (const slug of slugs) {
    const src = segmentSource(slug);
    if (!existsSync(src)) {
      console.error(`Missing ${src}`);
      process.exit(1);
    }
    normalizeClip(ffmpegBin, src, resolve(CLIPS_DIR, `${slug}.norm.mp4`));
  }

  const concatIn = slugs.map((_, i) => `[${i}:v]`).join("");
  const voArgs = voiceoverInputArgs();
  const hasVo = voArgs.length > 0;
  runFfmpeg(ffmpegBin, [
    "-y",
    ...slugs.flatMap((s) => ["-i", resolve(CLIPS_DIR, `${s}.norm.mp4`)]),
    ...voArgs,
    "-filter_complex",
    `${concatIn}concat=n=${slugs.length}:v=1:a=0,fps=${FPS},fade=t=in:st=0:d=0.25,fade=t=out:st=${(TOTAL_SEC - 0.25).toFixed(3)}:d=0.25[vout]`,
    "-map",
    "[vout]",
    ...(hasVo ? ["-map", `${slugs.length}:a`, "-c:a", "aac", "-b:a", "192k", "-shortest"] : []),
    "-t",
    String(TOTAL_SEC),
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "16",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(FPS),
    "-movflags",
    "+faststart",
    VIDEO_PATH,
  ]);

  const dur = probeDuration(ffmpegBin, VIDEO_PATH);
  console.log(`Wrote ${VIDEO_PATH} (${OUT_W}×${OUT_H}, ${dur?.toFixed(2) ?? "?"}s, mock concat)`);
}

function stitch(ffmpegBin: string) {
  if (MOCK_CAPTURE) {
    stitchMock(ffmpegBin);
    return;
  }

  const slugs = SEGMENTS.map((s) => s.slug);

  for (const slug of slugs) {
    const src = segmentSource(slug);
    if (!existsSync(src)) {
      console.error(`Missing ${src}`);
      process.exit(1);
    }
    normalizeClip(ffmpegBin, src, resolve(CLIPS_DIR, `${slug}.norm.mp4`));
  }

  const scale = `scale=${OUT_W}:${OUT_H}:force_original_aspect_ratio=increase,crop=${OUT_W}:${OUT_H},setsar=1`;
  const parts: string[] = [];
  for (let i = 0; i < slugs.length; i++) {
    parts.push(`[${i}:v]${scale},setpts=PTS-STARTPTS[v${i}]`);
  }

  let last = "v0";
  for (let i = 1; i < slugs.length; i++) {
    const out = i === slugs.length - 1 ? "vmerged" : `x${i}`;
    const offset = i * (CLIP_SEC - FADE_SEC);
    parts.push(
      `[${last}][v${i}]xfade=transition=${SEGMENTS[i]!.transition}:duration=${FADE_SEC}:offset=${offset.toFixed(3)}[${out}]`,
    );
    last = out;
  }

  parts.push(
    `[vmerged]tpad=stop_mode=clone:stop_duration=0.2,fade=t=in:st=0:d=0.25,fade=t=out:st=${(TOTAL_SEC - 0.25).toFixed(3)}:d=0.25[vout]`,
  );

  const voArgs = voiceoverInputArgs();
  const voIdx = slugs.length;
  runFfmpeg(ffmpegBin, [
    "-y",
    ...slugs.flatMap((s) => ["-i", resolve(CLIPS_DIR, `${s}.norm.mp4`)]),
    ...voArgs,
    "-filter_complex",
    parts.join(";"),
    "-map",
    "[vout]",
    ...(voArgs.length ? ["-map", `${voIdx}:a`, "-c:a", "aac", "-b:a", "192k", "-shortest"] : []),
    "-t",
    String(TOTAL_SEC),
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "16",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(FPS),
    "-movflags",
    "+faststart",
    VIDEO_PATH,
  ]);

  const dur = probeDuration(ffmpegBin, VIDEO_PATH);
  console.log(`Wrote ${VIDEO_PATH} (${OUT_W}×${OUT_H}, ${dur?.toFixed(2) ?? "?"}s)`);
}

async function main() {
  const ffmpegBin = resolveFfmpeg();
  console.log(`9:16 vertical · ${TOTAL_SEC}s · ${SEGMENTS.length} segments × ${CLIP_SEC.toFixed(2)}s`);

  if (COMPOSE_ONLY || (SKIP_CAPTURE && !MOCK_CAPTURE)) {
    mkdirSync(CLIPS_DIR, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    const frameClip = await ensurePhoneFrameClip(browser);
    for (const seg of SEGMENTS) {
      if (seg.kind === "phone") composePhoneScene(ffmpegBin, seg, frameClip);
    }
    await recordStudioPage(browser, "01-intro", introHtml());
    await recordStudioPage(browser, "06-outro", outroHtml());
    await browser.close();
  } else if (!SKIP_CAPTURE) {
    await recordAll(ffmpegBin);
  } else {
    console.log(`Reusing clips in ${CLIPS_DIR}`);
  }

  stitch(ffmpegBin);
<<<<<<< HEAD
  buildHorizontal(ffmpegBin);
  publishPublicVideos();
}

function buildHorizontal(ffmpegBin: string) {
  const horizontal = resolve(OUT_DIR, "dozen-launch-horizontal.mp4");
=======
  exportHorizontal(ffmpegBin);
  publishPublicVideos();
}

function exportHorizontal(ffmpegBin: string) {
  const videoHasAudio = existsSync(VOICEOVER_PATH);
>>>>>>> f4a23a2 (Rebuild launch promo video with motion and voiceover)
  runFfmpeg(ffmpegBin, [
    "-y",
    "-i",
    VIDEO_PATH,
<<<<<<< HEAD
    "-vf",
    "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080",
=======
    "-filter_complex",
    `[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=${FPS}[vout]`,
    "-map",
    "[vout]",
    ...(videoHasAudio ? ["-map", "0:a", "-c:a", "aac", "-b:a", "192k"] : []),
>>>>>>> f4a23a2 (Rebuild launch promo video with motion and voiceover)
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
<<<<<<< HEAD
    "-an",
    horizontal,
  ]);
  console.log(`Wrote ${horizontal}`);
  return horizontal;
=======
    "-movflags",
    "+faststart",
    HORIZONTAL_PATH,
  ]);
  const dur = probeDuration(ffmpegBin, HORIZONTAL_PATH);
  console.log(`Wrote ${HORIZONTAL_PATH} (1920×1080, ${dur?.toFixed(2) ?? "?"}s)`);
>>>>>>> f4a23a2 (Rebuild launch promo video with motion and voiceover)
}

function publishPublicVideos() {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  mkdirSync(STORE_VIDEO_DIR, { recursive: true });
  copyFileSync(VIDEO_PATH, resolve(PUBLIC_DIR, "dozen-launch-preview.mp4"));
  copyFileSync(VIDEO_PATH, resolve(STORE_VIDEO_DIR, "dozen-launch-preview.mp4"));
  if (existsSync(HORIZONTAL_PATH)) {
    copyFileSync(HORIZONTAL_PATH, resolve(PUBLIC_DIR, "dozen-launch-horizontal.mp4"));
    copyFileSync(HORIZONTAL_PATH, resolve(STORE_VIDEO_DIR, "dozen-launch-horizontal.mp4"));
  }
<<<<<<< HEAD
  const storeMedia = resolve(
    process.cwd(),
    "../cursor/stores/bc-09c7c829-8890-4733-97e5-51250955c098/media/videos",
  );
  try {
    mkdirSync(storeMedia, { recursive: true });
    copyFileSync(VIDEO_PATH, resolve(storeMedia, "dozen-launch-preview.mp4"));
    if (existsSync(horizontal)) {
      copyFileSync(horizontal, resolve(storeMedia, "dozen-launch-horizontal.mp4"));
    }
    console.log(`Copied videos → ${storeMedia}`);
  } catch {
    // optional store path
  }
  console.log(`Published → ${PUBLIC_DIR}`);
=======
  console.log(`Published → ${PUBLIC_DIR} + ${STORE_VIDEO_DIR}`);
>>>>>>> f4a23a2 (Rebuild launch promo video with motion and voiceover)
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
