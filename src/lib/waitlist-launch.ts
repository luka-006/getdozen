import { createAdminClient } from "@/lib/supabase/admin";
import { sendResendEmail } from "@/lib/resend-mail";

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "https://getdozen.dev";

export function waitlistLaunchEmailHtml() {
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0b1f3a;max-width:520px">
  <p>Hi —</p>
  <p><strong>Dozen is open.</strong> Test apps and indie games, earn Dots for quality feedback, and post your own work for structured reviews from real testers.</p>
  <p style="margin:24px 0">
    <a href="${SITE}/signup" style="display:inline-block;background:#1e4fd8;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Create your account</a>
  </p>
  <p>Or browse the board first: <a href="${SITE}/board">${SITE}/board</a></p>
  <p style="color:#64748b;font-size:14px;margin-top:32px">You joined the waitlist at getdozen.dev. If you no longer want updates, reply to this email.</p>
</body></html>`;
}

export function waitlistLaunchEmailText() {
  return `Dozen is open.

Test apps and indie games, earn Dots for quality feedback, and post your own work for structured reviews from real testers.

Create your account: ${SITE}/signup
Browse the board: ${SITE}/board

You joined the waitlist at getdozen.dev. Reply to this email if you no longer want updates.`;
}

export async function listConfirmedWaitlistEmails(): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("waitlist")
    .select("email")
    .not("confirmed_at", "is", null)
    .order("confirmed_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.email as string);
}

export type WaitlistLaunchResult = {
  dryRun: boolean;
  recipients: string[];
  sent: number;
  failed: number;
  errors: string[];
};

export async function sendWaitlistLaunchEmails(opts: {
  dryRun?: boolean;
  singleTo?: string;
}): Promise<WaitlistLaunchResult> {
  const dryRun = opts.dryRun ?? false;
  const recipients = opts.singleTo
    ? [opts.singleTo]
    : await listConfirmedWaitlistEmails();

  if (recipients.length === 0) {
    return { dryRun, recipients: [], sent: 0, failed: 0, errors: [] };
  }

  if (dryRun) {
    return { dryRun: true, recipients, sent: 0, failed: 0, errors: [] };
  }

  const subject = "Dozen is open — test apps, earn Dots, get feedback";
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const to of recipients) {
    const result = await sendResendEmail({
      to,
      subject,
      text: waitlistLaunchEmailText(),
      html: waitlistLaunchEmailHtml(),
    });
    if (result.ok) {
      sent++;
    } else {
      failed++;
      errors.push(`${to}: ${result.error}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  return { dryRun: false, recipients, sent, failed, errors };
}
