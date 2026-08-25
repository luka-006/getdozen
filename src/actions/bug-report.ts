"use server";

import { redirect } from "next/navigation";
import { requestIp } from "@/lib/assert-human";
import { getSessionUser } from "@/lib/auth";
import {
  adminConsolePath,
  requireAdminConsoleSession,
} from "@/lib/admin-console";
import { grantBugReportAward } from "@/lib/bug-award";
import { bugAwardClickUrl } from "@/lib/bug-award-token";
import {
  bugMailBrowserPayload,
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
  if (mailed.ok) return { ok: true as const };

  return {
    ok: true as const,
    mail: bugMailBrowserPayload(parsed, awardUrl),
  };
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
