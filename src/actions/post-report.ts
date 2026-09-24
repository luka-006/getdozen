"use server";

import { requestIp } from "@/lib/assert-human";
import { getSessionUser } from "@/lib/auth";
import { checkBotGuard } from "@/lib/bot-guard";
import {
  parsePostReport,
  savePostReport,
  sendPostReportEmail,
} from "@/lib/post-report-mail";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitPostReport(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!requestId) {
    return { ok: false as const, error: "Missing post." };
  }

  const guard = await checkBotGuard(formData, await requestIp(), "bug");
  if (!guard.ok) return { ok: false as const, error: guard.error };

  const admin = createAdminClient();
  const { data: request } = await admin
    .from("requests")
    .select("id, app_name")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) {
    return { ok: false as const, error: "That post was not found." };
  }

  const parsed = parsePostReport(formData, {
    requestId: request.id,
    appName: request.app_name,
  });
  if ("error" in parsed) return { ok: false as const, error: parsed.error };

  const user = await getSessionUser();
  const saved = await savePostReport(parsed, user?.id ?? null);
  if (!saved.ok) return saved;

  const mailed = await sendPostReportEmail(parsed);
  if (!mailed.ok) {
    console.error("post report saved but email failed", saved.id, mailed.error);
  }
  return { ok: true as const };
}
