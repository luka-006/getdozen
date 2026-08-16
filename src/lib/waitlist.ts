import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeWaitlistEmail(raw: unknown): string | null {
  const email = String(raw ?? "").trim().toLowerCase();
  if (email.length < 5 || email.length > 254) return null;
  if (!EMAIL_RE.test(email)) return null;
  return email;
}

export async function upsertWaitlistEmail(email: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("waitlist").upsert(
    { email, updated_at: new Date().toISOString() },
    { onConflict: "email" },
  );
  if (error) throw new Error(error.message);
}

export async function markWaitlistConfirmed(email: string) {
  const normalized = normalizeWaitlistEmail(email);
  if (!normalized) return;
  const admin = createAdminClient();
  await admin.from("waitlist").upsert(
    {
      email: normalized,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
}
