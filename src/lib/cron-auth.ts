import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

/** Vercel cron sends `Authorization: Bearer ${CRON_SECRET}`. Nothing else counts. */
export function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  return timingSafeEqual(digest(token), digest(secret));
}

export function denyCron(request: Request): NextResponse | null {
  if (cronAuthorized(request)) return null;
  return new NextResponse(null, {
    status: 401,
    headers: { "cache-control": "no-store" },
  });
}
