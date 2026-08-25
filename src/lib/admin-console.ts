import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { verifySync } from "otplib";
import { requireProfile } from "@/lib/auth";
import type { Profile } from "@/lib/types";

const SESSION_COOKIE = "dozen_console_sess";
const LOCK_COOKIE = "dozen_console_lock";
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const SESSION_MS = 8 * 60 * 60 * 1000;

export function adminConsolePath(): string {
  const raw = process.env.ADMIN_CONSOLE_PATH?.trim();
  if (raw && raw.startsWith("/") && !raw.includes("..")) {
    return raw.replace(/\/+$/, "") || raw;
  }
  if (process.env.NODE_ENV === "production") {
    return "/__console_unconfigured__";
  }
  return "/dev-console";
}

export function isAdminConsoleInternalPath(pathname: string): boolean {
  return (
    pathname === "/admin-console" || pathname.startsWith("/admin-console/")
  );
}

export function isLegacyAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function adminOwnerEmail(): string | null {
  const email = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase();
  return email || null;
}

export function isAdminOwner(profile: Pick<Profile, "is_admin" | "email">): boolean {
  if (!profile.is_admin) return false;
  const owner = adminOwnerEmail();
  if (!owner) return true;
  return profile.email.trim().toLowerCase() === owner;
}

function sessionSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "";
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET is required in production");
  }
  return secret || "dev-console-session";
}

function totpSecret(): string | null {
  const secret = process.env.ADMIN_TOTP_SECRET?.trim();
  return secret || null;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export type AdminSession = {
  uid: string;
  exp: number;
};

export function createAdminSessionToken(userId: string): string {
  const exp = Date.now() + SESSION_MS;
  const body = Buffer.from(JSON.stringify({ uid: userId, exp }), "utf8").toString(
    "base64url",
  );
  return `${body}.${sign(body)}`;
}

export function parseAdminSessionToken(token: string): AdminSession | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AdminSession;
    if (!parsed.uid || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function readAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseAdminSessionToken(token);
}

export async function setAdminSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createAdminSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
  jar.delete(LOCK_COOKIE);
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

type LockState = { fails: number; until: number };

export async function readLockState(): Promise<LockState> {
  const jar = await cookies();
  const raw = jar.get(LOCK_COOKIE)?.value;
  if (!raw) return { fails: 0, until: 0 };
  try {
    const parsed = JSON.parse(raw) as LockState;
    if (parsed.until && parsed.until > Date.now()) {
      return parsed;
    }
    return { fails: 0, until: 0 };
  } catch {
    return { fails: 0, until: 0 };
  }
}

export async function recordTotpFailure(): Promise<LockState> {
  const jar = await cookies();
  const current = await readLockState();
  const fails = current.fails + 1;
  const until = fails >= MAX_FAILS ? Date.now() + LOCK_MS : 0;
  const next: LockState = { fails, until };
  jar.set(LOCK_COOKIE, JSON.stringify(next), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: until ? LOCK_MS / 1000 : 3600,
  });
  return next;
}

export function verifyTotpCode(code: string): boolean {
  const secret = totpSecret();
  if (!secret) return false;
  const normalized = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const result = verifySync({
    secret,
    token: normalized,
    epochTolerance: 30,
  });
  return result.valid;
}

export function totpConfigured(): boolean {
  return Boolean(totpSecret());
}

/** Owner admin profile; 404 for everyone else (no hint the console exists). */
export async function requireAdminOwner(): Promise<Profile> {
  const profile = await requireProfile();
  if (!isAdminOwner(profile)) notFound();
  return profile;
}

/** Owner + valid authenticator session. */
export async function requireAdminConsoleSession(): Promise<Profile> {
  const profile = await requireAdminOwner();
  const session = await readAdminSession();
  if (!session || session.uid !== profile.id) {
    redirect(`${adminConsolePath()}/gate`);
  }
  return profile;
}

export function consoleConfigured(): boolean {
  return (
    totpConfigured() &&
    Boolean(process.env.ADMIN_SESSION_SECRET?.trim() || process.env.CRON_SECRET?.trim()) &&
    adminConsolePath() !== "/__console_unconfigured__"
  );
}
