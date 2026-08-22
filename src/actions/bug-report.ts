"use server";

import { requestIp } from "@/lib/assert-human";
import { getSessionUser } from "@/lib/auth";
import { checkBotGuard } from "@/lib/bot-guard";
import {
  bugMailBrowserPayload,
  parseBugReport,
  saveSiteBugReport,
  sendBugReportEmail,
} from "@/lib/bug-mail";

export async function submitBugReport(formData: FormData) {
  const guard = await checkBotGuard(formData, await requestIp(), "bug");
  if (!guard.ok) return { ok: false as const, error: guard.error };

  const parsed = parseBugReport(formData);
  if ("error" in parsed) return { ok: false as const, error: parsed.error };

  const user = await getSessionUser();
  const saved = await saveSiteBugReport(parsed, user?.id ?? null);
  if (!saved.ok) return saved;

  const mailed = await sendBugReportEmail(parsed);
  if (mailed.ok) return { ok: true as const };

  return {
    ok: true as const,
    mail: bugMailBrowserPayload(parsed),
  };
}
