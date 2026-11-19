/** Change the default here. Call sites read the parsed env value. */
export const WAITLIST_BONUS_DOTS_DEFAULT = 10;
export const REFERRAL_BONUS_DOTS_DEFAULT = 2;
export const REFERRAL_MAX_DEFAULT = 25;

const warned = new Set<string>();

export function resetRewardConfigWarnings() {
  warned.clear();
}

function warnOnce(name: string, raw: string) {
  if (warned.has(name)) return;
  warned.add(name);
  console.warn(
    `${name}=${raw} is not a positive integer; that grant is disabled`,
  );
}

/**
 * Blank means the default. Anything that is not a base-10 integer above zero
 * disables the grant and logs a warning.
 */
export function parsePositiveIntEnv(name: string, fallback: number): number | null {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const text = raw.trim();
  if (!/^[0-9]+$/.test(text)) {
    warnOnce(name, text);
    return null;
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value <= 0) {
    warnOnce(name, text);
    return null;
  }
  return value;
}

export function waitlistBonusDots(): number | null {
  return parsePositiveIntEnv("WAITLIST_BONUS_DOTS", WAITLIST_BONUS_DOTS_DEFAULT);
}

export function referralBonusDots(): number | null {
  return parsePositiveIntEnv("REFERRAL_BONUS_DOTS", REFERRAL_BONUS_DOTS_DEFAULT);
}

export function referralMax(): number | null {
  return parsePositiveIntEnv("REFERRAL_MAX", REFERRAL_MAX_DEFAULT);
}
