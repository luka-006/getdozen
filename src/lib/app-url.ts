/** Canonical production origin — no localhost fallbacks. */
export const SITE_ORIGIN = "https://getdozen.dev";

const ALLOWED_HOSTS = new Set([
  "getdozen.dev",
  "www.getdozen.dev",
]);

export function isAllowedAppHost(host: string): boolean {
  const bare = host.toLowerCase().split(":")[0] ?? "";
  if (ALLOWED_HOSTS.has(bare)) return true;
  if (bare === "localhost" || bare === "127.0.0.1") return true;
  // Preview deploys still need to round-trip OAuth on their own host.
  return bare.endsWith(".vercel.app");
}

/**
 * Public origin for redirects (OAuth, Stripe return URLs).
 * Prefer the request host when it is a known Dozen domain; otherwise SITE_ORIGIN.
 */
export function resolveAppUrl(request?: Request): string {
  if (request) {
    return resolveRequestOrigin(request);
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) return fromEnv;
  return SITE_ORIGIN;
}

export function resolveRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  return originFromHeaders({
    host: request.headers.get("x-forwarded-host") ?? url.host,
    proto: request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", ""),
    fallbackUrl: request.url,
  });
}

/** For Server Actions — read host from the incoming request headers. */
export async function resolveAppUrlFromHeaders(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  return originFromHeaders({
    host: h.get("x-forwarded-host") ?? h.get("host"),
    proto: h.get("x-forwarded-proto"),
    fallbackUrl: null,
  });
}

function originFromHeaders(opts: {
  host: string | null;
  proto: string | null;
  fallbackUrl: string | null;
}): string {
  if (opts.host) {
    const host = opts.host.split(",")[0]?.trim();
    if (host && isAllowedAppHost(host)) {
      const proto =
        (opts.proto ?? "https").split(",")[0]?.trim() || "https";
      return `${proto}://${host}`;
    }
  }
  if (opts.fallbackUrl) {
    try {
      const origin = new URL(opts.fallbackUrl).origin;
      const host = new URL(opts.fallbackUrl).host;
      if (isAllowedAppHost(host)) return origin;
    } catch {
      // fall through
    }
  }
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) return fromEnv;
  return SITE_ORIGIN;
}
