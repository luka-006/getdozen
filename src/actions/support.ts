"use server";

import { requestIp } from "@/lib/assert-human";
import { getSessionUser } from "@/lib/auth";
import { checkBotGuard } from "@/lib/bot-guard";
import { parseSupportMessage, sendSupportEmail } from "@/lib/support-mail";

export async function submitSupportMessage(formData: FormData) {
  const guard = await checkBotGuard(formData, await requestIp(), "support");
  if (!guard.ok) return { ok: false as const, error: guard.error };

  const parsed = parseSupportMessage(formData);
  if ("error" in parsed) return { ok: false as const, error: parsed.error };

  const user = await getSessionUser();
  if (user?.email && !parsed.email) {
    parsed.email = user.email;
  }

  const mailed = await sendSupportEmail(parsed);
  if (!mailed.ok) return { ok: false as const, error: mailed.error };

  return { ok: true as const };
}
