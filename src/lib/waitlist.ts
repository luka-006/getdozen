import { normalizeEmailIdentity } from "@/lib/email-identity";
import { normalizeReferralCode } from "@/lib/referral-code";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeWaitlistEmail(raw: unknown): string | null {
  const email = String(raw ?? "").trim().toLowerCase();
  if (email.length < 5 || email.length > 254) return null;
  if (!EMAIL_RE.test(email)) return null;
  return email;
}

export type WaitlistRow = {
  id: string;
  email: string;
  referral_code: string | null;
};

async function findWaitlistByIdentity(email: string): Promise<WaitlistRow | null> {
  const admin = createAdminClient();
  const identity = normalizeEmailIdentity(email);
  const { data, error } = await admin
    .from("waitlist")
    .select("id, email, referral_code")
    .eq("email_normalized", identity)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WaitlistRow | null) ?? null;
}

export async function attachWaitlistReferral(email: string, refCode: unknown) {
  const code = normalizeReferralCode(refCode);
  if (!code) return;
  const admin = createAdminClient();
  const { error } = await admin.rpc("attach_waitlist_referral", {
    p_email: email,
    p_code: code,
  });
  if (error) throw new Error(error.message);
}

export async function upsertWaitlistEmail(
  email: string,
  refCode?: unknown,
): Promise<WaitlistRow> {
  const existing = await findWaitlistByIdentity(email);
  if (existing) {
    await attachWaitlistReferral(existing.email, refCode);
    return existing;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("waitlist")
    .upsert(
      {
        email,
        email_normalized: normalizeEmailIdentity(email),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    )
    .select("id, email, referral_code")
    .single();

  if (error) {
    const raced = await findWaitlistByIdentity(email);
    if (raced) {
      await attachWaitlistReferral(raced.email, refCode);
      return raced;
    }
    throw new Error(error.message);
  }

  const row = data as WaitlistRow;
  await attachWaitlistReferral(row.email, refCode);
  if (!row.referral_code) {
    const again = await findWaitlistByIdentity(row.email);
    if (again) return again;
  }
  return row;
}

export async function markWaitlistConfirmed(email: string) {
  const normalized = normalizeWaitlistEmail(email);
  if (!normalized) return;
  const admin = createAdminClient();
  const now = new Date().toISOString();
  let existing: WaitlistRow | null = null;
  try {
    existing = await findWaitlistByIdentity(normalized);
  } catch {
    existing = null;
  }
  if (existing) {
    const { error } = await admin
      .from("waitlist")
      .update({ confirmed_at: now, updated_at: now })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await admin.from("waitlist").upsert(
    {
      email: normalized,
      confirmed_at: now,
      updated_at: now,
    },
    { onConflict: "email" },
  );
  if (error) throw new Error(error.message);
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
