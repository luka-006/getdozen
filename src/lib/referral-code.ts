/** No 0/O or 1/l/I. Lowercase so a shared link is case-insensitive. */
export const REFERRAL_CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
export const REFERRAL_CODE_LENGTH = 8;

const CODE_RE = new RegExp(
  `^[${REFERRAL_CODE_ALPHABET}]{${REFERRAL_CODE_LENGTH}}$`,
);

export function normalizeReferralCode(raw: unknown): string | null {
  const code = String(raw ?? "").trim().toLowerCase();
  if (!CODE_RE.test(code)) return null;
  return code;
}

export function referralCodeAlphabetPattern(): string {
  return CODE_RE.source;
}
