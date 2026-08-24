import { createHmac, timingSafeEqual } from "crypto";
import { SITE_ORIGIN } from "@/lib/app-url";

function awardSecret() {
  return (
    process.env.ADMIN_AWARD_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

export function signBugAwardToken(bugId: string) {
  const secret = awardSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(bugId).digest("base64url");
}

export function verifyBugAwardToken(bugId: string, sig: string) {
  const expected = signBugAwardToken(bugId);
  if (!expected || !sig) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** One-click Award link for admin email (FormSubmit / Resend). */
export function bugAwardClickUrl(bugId: string) {
  const sig = signBugAwardToken(bugId);
  if (!sig) return bugAwardAdminUrl(bugId);
  const params = new URLSearchParams({ bug: bugId, sig });
  return `${SITE_ORIGIN}/api/admin/award-bug?${params.toString()}`;
}

export function bugAwardAdminUrl(bugId: string) {
  return `${SITE_ORIGIN}/admin?bug=${encodeURIComponent(bugId)}#award`;
}
