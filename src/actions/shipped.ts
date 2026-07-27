"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const shippedSchema = z.object({
  app_name: z.string().trim().min(2).max(120),
  app_url: z.string().trim().url(),
  launched_at: z.union([
    z.literal(""),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid launch date"),
  ]),
  helper_emails: z.string().trim().max(2000).optional(),
});

async function resolveHelperIds(emailsRaw: string | undefined, ownerId: string) {
  if (!emailsRaw?.trim()) return [] as string[];

  const emails = [
    ...new Set(
      emailsRaw
        .split(/[,;\n]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  if (emails.length === 0) return [];
  if (emails.length > 24) {
    throw new Error("Add at most 24 helpers.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email")
    .in("email", emails);

  if (error) throw new Error(error.message);

  const found = new Map((data ?? []).map((p) => [p.email.toLowerCase(), p.id]));
  const missing = emails.filter((e) => !found.has(e));
  if (missing.length > 0) {
    throw new Error(`No profiles found for: ${missing.join(", ")}`);
  }

  return [...found.values()].filter((id) => id !== ownerId);
}

export async function addShippedApp(formData: FormData) {
  const profile = await requireProfile();
  const parsed = shippedSchema.safeParse({
    app_name: formData.get("app_name"),
    app_url: formData.get("app_url"),
    launched_at: formData.get("launched_at") ?? "",
    helper_emails: String(formData.get("helper_emails") ?? "") || undefined,
  });

  if (!parsed.success) {
    redirect(
      `/wall/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid form")}`,
    );
  }

  const data = parsed.data;
  let helperIds: string[] = [];
  try {
    helperIds = await resolveHelperIds(data.helper_emails, profile.id);
  } catch (err) {
    redirect(
      `/wall/new?error=${encodeURIComponent(err instanceof Error ? err.message : "Could not resolve helpers")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("shipped_apps").insert({
    owner_id: profile.id,
    app_name: data.app_name,
    app_url: data.app_url,
    launched_at: data.launched_at || new Date().toISOString().slice(0, 10),
    helper_ids: helperIds,
  });

  if (error) {
    redirect(`/wall/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/wall");
  revalidatePath(`/profile/${profile.id}`);
  redirect("/wall");
}
