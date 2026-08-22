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

export type TurnstileAction = "login" | "signup" | "reset" | "waitlist" | "bug";

type SiteverifyResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export function turnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
}

function turnstileSecret() {
  return (
    process.env.TURNSTILE_SECRET?.trim() ||
    process.env.TURNSTILE_SECRET_KEY?.trim() ||
    ""
  );
}

export function turnstileHostnames() {
  return new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );
}

export function honeypotTripped(formData: FormData) {
  return String(formData.get("company_url") ?? "").trim().length > 0;
}

export async function verifyTurnstile(
  token: string,
  options: {
    ip?: string | null;
    secret?: string;
    expectedAction?: string;
    expectedHostnames?: Set<string>;
  } = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = options.secret ?? turnstileSecret();
  if (!secret) {
    return { ok: true };
  }

  const trimmed = token.trim();
  if (!trimmed || trimmed.length > 2048) {
    return { ok: false, error: "Confirm you are not a bot." };
  }

  const body = new URLSearchParams({
    secret,
    response: trimmed,
  });
  const ipValue = options.ip?.split(",")[0]?.trim();
  if (ipValue) body.set("remoteip", ipValue);

  let result: SiteverifyResult;
  try {
    const res = await fetch(TURNSTILE_SITEVERIFY, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body,
    });
    if (!res.ok) {
      return { ok: false, error: "Bot check failed. Try again." };
    }
    result = (await res.json()) as SiteverifyResult;
  } catch {
    return { ok: false, error: "Bot check failed. Try again." };
  }

  if (!result.success) {
    return { ok: false, error: "Bot check failed. Try again." };
  }
  if (options.expectedAction && result.action !== options.expectedAction) {
    return { ok: false, error: "Bot check failed. Try again." };
  }
  if (
    options.expectedHostnames &&
    options.expectedHostnames.size > 0 &&
    (!result.hostname || !options.expectedHostnames.has(result.hostname))
  ) {
    return { ok: false, error: "Bot check failed. Try again." };
  }
  return { ok: true };
}

export async function checkBotGuard(
  formData: FormData,
  ip?: string | null,
  expectedAction?: TurnstileAction,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (honeypotTripped(formData)) {
    return { ok: false, error: "Could not submit just now. Try again." };
  }
  const token = String(formData.get("cf-turnstile-response") ?? "");
  if (process.env.NODE_ENV === "development" && !token.trim()) {
    return { ok: true };
  }
  return verifyTurnstile(token, {
    ip,
    expectedAction,
    expectedHostnames: turnstileHostnames(),
  });
}
