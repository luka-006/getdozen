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

export async function removeWaitlistEmail(email: string): Promise<boolean> {
  const normalized = normalizeWaitlistEmail(email);
  if (!normalized) return false;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("waitlist")
    .delete()
    .eq("email", normalized)
    .select("id");

  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function removeWaitlistById(id: string): Promise<boolean> {
  if (!id) return false;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("waitlist")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}
