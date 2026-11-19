/** URL prefixes written by the demo seed scripts. Never show these in public lists. */
export const SEEDED_APP_URL_PREFIXES = [
  "https://promo.getdozen.dev/",
  "https://preview.example/",
] as const;

export function isSeededShippedAppUrl(url: string | null | undefined): boolean {
  const value = (url ?? "").trim().toLowerCase();
  return SEEDED_APP_URL_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export function visibleShippedApps<T extends { app_url?: string | null }>(
  rows: T[],
): T[] {
  return rows.filter((row) => !isSeededShippedAppUrl(row.app_url));
}
