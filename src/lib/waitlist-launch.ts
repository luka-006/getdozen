import { createAdminClient } from "@/lib/supabase/admin";
import { escapeHtml, renderMailLayout } from "@/lib/mail-layout";
import { getReferralShare } from "@/lib/account-rewards";
import { sendResendEmail } from "@/lib/resend-mail";

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "https://getdozen.dev";

function shareBlock(share?: { url: string; line: string | null }) {
  if (!share) return { html: "", text: "" };
  const line = share.line ? `\n${share.line}` : "";
  return {
    html: `<p style="margin:16px 0 0">Your invite link: <a href="${escapeHtml(share.url)}">${escapeHtml(share.url)}</a></p>${
      share.line
        ? `<p style="margin:8px 0 0">${escapeHtml(share.line)}</p>`
        : ""
    }`,
    text: `\nYour invite link: ${share.url}${line}\n`,
  };
}

export function waitlistLaunchEmailHtml(share?: { url: string; line: string | null }) {
  const extra = shareBlock(share).html;
  return renderMailLayout({
    title: "Dozen is open",
    bodyHtml: `
      <p style="margin:0 0 12px">Hi,</p>
      <p style="margin:0">Test apps and indie games, earn Dots for quality feedback, and post your own work for structured reviews from real testers.</p>
      ${extra}
    `,
    cta: { label: "Create your account", href: `${SITE}/signup` },
    footerNote: "you joined the Dozen waitlist.",
  });
}

export function waitlistLaunchEmailText(share?: { url: string; line: string | null }) {
  return `Dozen is open.

Test apps and indie games, earn Dots for quality feedback, and post your own work for structured reviews from real testers.
${shareBlock(share).text}
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

  const subject = "Dozen is open: test apps, earn Dots, get feedback";
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const to of recipients) {
    let share: { url: string; line: string | null } | undefined;
    try {
      const info = await getReferralShare({ email: to });
      if (info.shareUrl) share = { url: info.shareUrl, line: info.inviteLine };
    } catch (err) {
      console.error("waitlist launch referral", err);
    }
    const result = await sendResendEmail({
      to,
      subject,
      text: waitlistLaunchEmailText(share),
      html: waitlistLaunchEmailHtml(share),
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
