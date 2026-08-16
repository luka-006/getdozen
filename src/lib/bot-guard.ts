export const TURNSTILE_SITEVERIFY =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Official Cloudflare dummy keys for tests. Work from any domain. */
export const TURNSTILE_DUMMY = {
  passSiteKey: "1x00000000000000000000AA",
  blockSiteKey: "2x00000000000000000000AB",
  passSecret: "1x0000000000000000000000000000000AA",
  failSecret: "2x0000000000000000000000000000000AA",
  token: "XXXX.DUMMY.TOKEN.XXXX",
} as const;

export function turnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
}

function turnstileSecret() {
  return process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
}

export function honeypotTripped(formData: FormData) {
  return String(formData.get("company_url") ?? "").trim().length > 0;
}

export async function verifyTurnstile(
  token: string,
  ip?: string | null,
  secret = turnstileSecret(),
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!secret) {
    return { ok: true };
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return { ok: false, error: "Confirm you are not a bot." };
  }

  const body = new URLSearchParams({
    secret,
    response: trimmed,
  });
  const ipValue = ip?.split(",")[0]?.trim();
  if (ipValue) body.set("remoteip", ipValue);

  const res = await fetch(TURNSTILE_SITEVERIFY, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as { success?: boolean };
  if (!data.success) {
    return { ok: false, error: "Bot check failed. Try again." };
  }
  return { ok: true };
}

export async function checkBotGuard(
  formData: FormData,
  ip?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (honeypotTripped(formData)) {
    return { ok: false, error: "Could not submit just now. Try again." };
  }
  const token = String(formData.get("cf-turnstile-response") ?? "");
  return verifyTurnstile(token, ip);
}
