/**
 * Short-lived proof that this browser just confirmed a waitlist row.
 * The token is an HMAC over the row id and an expiry. The client never
 * sends the id or the email. WAITLIST_EARLY_ACCESS_SECRET is required;
 * a missing or short secret fails closed and writes nothing.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const EARLY_ACCESS_COOKIE = "dozen_waitlist_early";
export const EARLY_ACCESS_TTL_SECONDS = 20 * 60;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 8;

const attempts = new Map<string, number[]>();

export type EarlyAccessFlag = "set" | "already" | "missing";

export type EarlyAccessStore = {
  flag(id: string, atIso: string): Promise<EarlyAccessFlag>;
};

export function earlyAccessSecret(): string | null {
  const secret = (process.env.WAITLIST_EARLY_ACCESS_SECRET ?? "").trim();
  return secret.length >= 16 ? secret : null;
}

export function resetEarlyAccessRateLimit() {
  attempts.clear();
}

export function allowEarlyAccessAttempt(ip: string, nowMs: number): boolean {
  const key = ip.trim() || "unknown";
  const recent = (attempts.get(key) ?? []).filter((at) => nowMs - at < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(nowMs);
  attempts.set(key, recent);
  return true;
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

export async function signEarlyAccessToken(
  secret: string,
  rowId: string,
  nowMs = Date.now(),
): Promise<string> {
  const exp = Math.floor(nowMs / 1000) + EARLY_ACCESS_TTL_SECONDS;
  const payload = `v1.${rowId}.${exp}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verifyEarlyAccessToken(
  token: string | null | undefined,
  secret: string | null,
  nowMs = Date.now(),
): Promise<string | null> {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [version, rowId, expRaw, signature] = parts;
  if (version !== "v1" || !rowId || !expRaw || !signature) return null;
  if (!UUID_RE.test(rowId)) return null;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(nowMs / 1000)) return null;
  const expected = await hmac(secret, `${version}.${rowId}.${expRaw}`);
  if (!timingSafeEqual(expected, signature)) return null;
  return rowId;
}

export async function applyEarlyAccess(input: {
  token: string | null;
  secret: string | null;
  nowMs: number;
  ip: string;
  store: EarlyAccessStore;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!allowEarlyAccessAttempt(input.ip, input.nowMs)) {
    return { ok: false, error: "Try again in a few minutes." };
  }
  const rowId = await verifyEarlyAccessToken(input.token, input.secret, input.nowMs);
  if (!rowId) {
    return { ok: false, error: "Could not save that just now. Try again." };
  }
  const result = await input.store.flag(rowId, new Date(input.nowMs).toISOString());
  if (result === "missing") {
    return { ok: false, error: "Could not save that just now. Try again." };
  }
  return { ok: true };
}

export function earlyAccessCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: EARLY_ACCESS_TTL_SECONDS,
    secure,
  };
}
