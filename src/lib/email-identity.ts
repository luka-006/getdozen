/**
 * Identity used for referral self-checks and duplicate detection.
 * Delivery still uses the trimmed, lowercased address with plus-tags and dots intact.
 */
export function normalizeEmailIdentity(raw: unknown): string {
  const trimmed = String(raw ?? "").trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return trimmed;

  let local = trimmed.slice(0, at);
  let domain = trimmed.slice(at + 1);
  const plus = local.indexOf("+");
  if (plus >= 0) local = local.slice(0, plus);
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replaceAll(".", "");
  return `${local}@${domain}`;
}

export function sameEmailIdentity(a: unknown, b: unknown): boolean {
  const left = normalizeEmailIdentity(a);
  const right = normalizeEmailIdentity(b);
  return left.length > 0 && left === right;
}
