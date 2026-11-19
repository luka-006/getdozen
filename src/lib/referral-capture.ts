import { normalizeReferralCode } from "@/lib/referral-code";

export const REFERRAL_COOKIE = "dozen_ref";
/** First-party, readable by the waitlist form. First touch wins. */
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function resolveReferralCapture(input: {
  query: string | null | undefined;
  cookie: string | null | undefined;
}): { code: string | null; setCookie: boolean } {
  const cookie = normalizeReferralCode(input.cookie);
  if (cookie) return { code: cookie, setCookie: false };
  const query = normalizeReferralCode(input.query);
  if (query) return { code: query, setCookie: true };
  return { code: null, setCookie: false };
}
