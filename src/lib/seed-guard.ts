/** Seed writers must refuse a production Vercel deploy. */
export function seedBlockedReason(): string | null {
  if (process.env.VERCEL_ENV === "production") return "VERCEL_ENV=production";
  return null;
}

export function assertSeedAllowed(action: string) {
  const reason = seedBlockedReason();
  if (reason) {
    throw new Error(`${action} is disabled (${reason}).`);
  }
}
