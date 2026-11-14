import { isPublicSeoPath } from "@/lib/seo";

/** httpOnly cookie set by a valid /invite/<code> visit. */
export const INVITE_COOKIE = "dozen_invite";
const INVITE_TTL_SECONDS = 60 * 60 * 24 * 30;

/**
 * Pages a logged-out visitor can render while the product is locked.
 * Legal pages are here because the waitlist form and cookie banner link to them.
 * /auth/callback and /auth/confirm stay so the existing email confirmation can finish.
 */
const WAITLIST_PAGES = new Set([
  "/",
  "/privacy",
  "/terms",
  "/cookies",
  "/waitlist/confirmed",
  "/auth/confirm",
]);

const WAITLIST_GET_EXACT = new Set([
  ...WAITLIST_PAGES,
  "/auth/callback",
  "/favicon.ico",
  "/icon",
  "/icon.svg",
  "/icon-48.png",
  "/icon-96.png",
  "/apple-icon",
  "/opengraph-image",
  "/twitter-image",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
]);

const PUBLIC_FILE = /\.(?:avif|webp|png|jpe?g|gif|svg|ico|woff2)$/i;

export type LockHeaders = {
  middlewareSubrequest?: string | null;
  nextAction?: string | null;
  rsc?: string | null;
  prefetch?: string | null;
};

export type AccessDecision =
  | { kind: "next" }
  | { kind: "not-found" }
  | { kind: "redirect"; pathname: string }
  | { kind: "rewrite"; pathname: string }
  | { kind: "invite"; code: string }
  | { kind: "session" };

export type AccessInput = {
  launchOpen: boolean;
  /** Already normalized path. */
  path: string;
  method: string;
  headers?: LockHeaders;
  /** Valid invite cookie or allowlisted admin email. */
  unlocked?: boolean;
  production?: boolean;
  /** Normalized ADMIN_CONSOLE_PATH, when configured. */
  adminConsolePath?: string;
};

export function normalizeLockPath(input: string): string {
  let path = input.split("?")[0]?.split("#")[0] ?? "";
  path = path.replace(/\\/g, "/").replace(/\0/g, "");
  for (let pass = 0; pass < 2; pass += 1) {
    try {
      const decoded = decodeURIComponent(path);
      if (decoded === path) break;
      path = decoded;
    } catch {
      break;
    }
  }
  path = path.toLowerCase();
  if (!path.startsWith("/")) path = `/${path}`;
  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  const normalized = `/${parts.join("/")}`;
  return normalized === "" ? "/" : normalized;
}

export function isWaitlistDocumentPath(path: string): boolean {
  return WAITLIST_PAGES.has(normalizeLockPath(path));
}

function allowsMethod(method: string, allowed: string[]): boolean {
  const name = method.toUpperCase();
  if (name === "HEAD" && allowed.includes("GET")) return true;
  return allowed.includes(name);
}

/** True when this path may be served with no invite cookie and no admin email. */
export function isWaitlistAllowlisted(path: string, method: string): boolean {
  if (path.startsWith("/_next/static/") || path === "/_next/static") {
    return allowsMethod(method, ["GET", "OPTIONS"]);
  }
  if (path === "/_next/image" || path.startsWith("/_next/image/")) {
    return allowsMethod(method, ["GET", "OPTIONS"]);
  }
  if (PUBLIC_FILE.test(path) || WAITLIST_GET_EXACT.has(path)) {
    if (path === "/" || path === "/waitlist/confirmed" || path === "/auth/confirm") {
      return allowsMethod(method, ["GET", "POST", "OPTIONS"]);
    }
    if (path === "/auth/callback") {
      return allowsMethod(method, ["GET"]);
    }
    return allowsMethod(method, ["GET", "OPTIONS"]);
  }
  return false;
}

function parseInvite(path: string): { code: string } | { invalid: true } | null {
  if (path === "/invite") return { invalid: true };
  if (!path.startsWith("/invite/")) return null;
  const code = path.slice("/invite/".length);
  if (!code || code.includes("/") || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(code)) {
    return { invalid: true };
  }
  return { code };
}

function isOpenLegalPath(path: string): boolean {
  return (
    path === "/privacy" ||
    path === "/terms" ||
    path.startsWith("/terms/") ||
    path === "/cookies" ||
    path === "/legal" ||
    path === "/contact"
  );
}

/** Public paths when LAUNCH_OPEN is not false. Mirrors the pre-lock middleware. */
export function isOpenPublicPath(path: string): boolean {
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/auth");
  return (
    path === "/" ||
    isAuthRoute ||
    isOpenLegalPath(path) ||
    path.startsWith("/api/cron") ||
    path.startsWith("/api/resend") ||
    path.startsWith("/api/stripe") ||
    path === "/wall" ||
    path === "/guides" ||
    path === "/blog" ||
    path.startsWith("/blog/") ||
    path.startsWith("/profile/") ||
    isPublicSeoPath(path)
  );
}

export function openModeNeedsSession(path: string): boolean {
  if (path.startsWith("/login") || path.startsWith("/signup")) return true;
  return !isOpenPublicPath(path);
}

function isLegacyAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/");
}

function isAdminConsoleInternalPath(path: string): boolean {
  return path === "/admin-console" || path.startsWith("/admin-console/");
}

/**
 * Pure lock decision. RSC, prefetch, Next-Action, and x-middleware-subrequest
 * never widen access: blocked paths stay not-found, allowed paths stay next.
 */
export function decideAccess(input: AccessInput): AccessDecision {
  const path = input.path;
  const method = input.method.toUpperCase();
  const headers = input.headers ?? {};

  if (isLegacyAdminPath(path) || isAdminConsoleInternalPath(path)) {
    return { kind: "not-found" };
  }

  if (!input.launchOpen && !input.unlocked) {
    // The subrequest header is not a pass. Callers also delete it.
    void headers.middlewareSubrequest;
    void headers.rsc;
    void headers.prefetch;
    void headers.nextAction;

    if (path.includes("%")) return { kind: "not-found" };

    const invite = parseInvite(path);
    if (invite) {
      if ("invalid" in invite) return { kind: "not-found" };
      if (method === "GET" || method === "HEAD") {
        return { kind: "invite", code: invite.code };
      }
      return { kind: "not-found" };
    }

    if (!isWaitlistAllowlisted(path, method)) return { kind: "not-found" };
    return { kind: "next" };
  }

  if (input.production && path === "/setup") {
    return { kind: "redirect", pathname: "/board" };
  }

  const consolePath = input.adminConsolePath;
  if (
    consolePath &&
    consolePath !== "/__console_unconfigured__" &&
    (path === consolePath || path.startsWith(`${consolePath}/`))
  ) {
    return {
      kind: "rewrite",
      pathname: `/admin-console${path.slice(consolePath.length)}`,
    };
  }

  if (openModeNeedsSession(path)) return { kind: "session" };
  return { kind: "next" };
}

export function evaluateRequest(
  input: Omit<AccessInput, "path"> & { pathname: string },
): AccessDecision {
  const { pathname, ...rest } = input;
  return decideAccess({ ...rest, path: normalizeLockPath(pathname) });
}

export function inviteCookieSecret(): string | null {
  const secret = (
    process.env.INVITE_COOKIE_SECRET ||
    process.env.CREDENTIALS_ENCRYPTION_KEY ||
    ""
  ).trim();
  return secret.length >= 16 ? secret : null;
}

export function adminEmails(): Set<string> {
  const raw = [process.env.ADMIN_EMAILS, process.env.ADMIN_OWNER_EMAIL]
    .filter(Boolean)
    .join(",");
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowlistedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().has(email.trim().toLowerCase());
}

export function inviteCodes(): string[] {
  return (process.env.INVITE_CODES ?? "")
    .split(",")
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean);
}

function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let i = 0; i < length; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

export function inviteCodeMatches(code: string): boolean {
  const candidate = code.trim().toLowerCase();
  const codes = inviteCodes();
  if (!candidate || codes.length === 0) return false;
  let matched = false;
  for (const item of codes) {
    if (timingSafeEqual(item, candidate)) matched = true;
  }
  return matched;
}

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  let binary = "";
  for (const byte of new Uint8Array(signature)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function signInviteCookie(
  secret: string,
  nowMs = Date.now(),
): Promise<string> {
  const exp = Math.floor(nowMs / 1000) + INVITE_TTL_SECONDS;
  const payload = `v1.${exp}`;
  const signature = await hmac(secret, payload);
  return `${payload}.${signature}`;
}

export async function verifyInviteCookie(
  token: string | null | undefined,
  secret: string | null,
  nowMs = Date.now(),
): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expRaw, signature] = parts;
  if (version !== "v1" || !expRaw || !signature) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(nowMs / 1000)) return false;
  const expected = await hmac(secret, `${version}.${expRaw}`);
  return timingSafeEqual(expected, signature);
}

export const INVITE_COOKIE_MAX_AGE = INVITE_TTL_SECONDS;
