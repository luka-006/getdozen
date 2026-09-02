"use server";

import { redirect } from "next/navigation";
import { requestIp } from "@/lib/assert-human";
import { getSessionUser } from "@/lib/auth";
import {
  requireAdminConsoleSession,
} from "@/lib/admin-console";
import { adminConsolePath } from "@/lib/admin-console-path";
import { grantBugReportAward } from "@/lib/bug-award";
import { bugAwardClickUrl } from "@/lib/bug-award-token";
import {
  parseBugReport,
  saveSiteBugReport,
  sendBugReportEmail,
} from "@/lib/bug-mail";
import { checkBotGuard } from "@/lib/bot-guard";

export async function submitBugReport(formData: FormData) {
  const guard = await checkBotGuard(formData, await requestIp(), "bug");
  if (!guard.ok) return { ok: false as const, error: guard.error };

  const parsed = parseBugReport(formData);
  if ("error" in parsed) return { ok: false as const, error: parsed.error };

  const user = await getSessionUser();
  const saved = await saveSiteBugReport(parsed, user?.id ?? null);
  if (!saved.ok) return saved;

  const awardUrl = bugAwardClickUrl(saved.id);
  const mailed = await sendBugReportEmail(parsed, awardUrl);
  if (!mailed.ok) {
    console.error("bug report saved but email failed", saved.id, mailed.error);
    // Report is in site_bug_reports — do not fail the user when mail is down.
    return { ok: true as const };
  }
  return { ok: true as const };
}

export async function awardBugReport(formData: FormData) {
  await requireAdminConsoleSession();

  const bugId = String(formData.get("bug_id") ?? "");
  const result = await grantBugReportAward(bugId);
  const params = new URLSearchParams();
  if (bugId) params.set("bug", bugId);
  params.set("message", result.message);
  redirect(`${adminConsolePath()}?${params.toString()}`);
}
