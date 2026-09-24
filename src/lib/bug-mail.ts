import { BUG_REPORT_AWARD } from "@/lib/constants";
import { formatDots } from "@/lib/currency";
import { escapeHtml, renderMailLayout } from "@/lib/mail-layout";
import { sendResendEmail, supportInbox } from "@/lib/resend-mail";
import { createAdminClient } from "@/lib/supabase/admin";

export const BUG_REPORT_TO = supportInbox();

export type BugReportInput = {
  summary: string;
  details: string;
  email: string;
  page: string;
};

export function parseBugReport(formData: FormData): BugReportInput | { error: string } {
  const summary = String(formData.get("summary") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const page = String(formData.get("page") ?? "").trim().slice(0, 500);

  if (summary.length < 8 || summary.length > 160) {
    return { error: "Describe the bug in 8 to 160 characters." };
  }
  if (details.length < 12 || details.length > 4000) {
    return { error: "Add a bit more detail (12 to 4000 characters)." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "That email does not look valid." };
  }
  if (page && !page.startsWith("/")) {
    return { error: "Could not send just now. Try again." };
  }

  return { summary, details, email, page: page || "/" };
}

function mailBody(report: BugReportInput, awardUrl?: string | null) {
  const lines = [
    `Page: ${report.page}`,
    `From: ${report.email || "(not given)"}`,
    "",
    report.summary,
    "",
    report.details,
  ];
  if (awardUrl) {
    lines.push(
      "",
      `If this is a proper report, Award ${formatDots(BUG_REPORT_AWARD)}:`,
      awardUrl,
    );
  }
  return lines.join("\n");
}

function mailHtml(report: BugReportInput, awardUrl?: string | null) {
  return renderMailLayout({
    title: "Bug report",
    bodyHtml: `
      <p style="margin:0 0 8px"><strong>Page:</strong> ${escapeHtml(report.page)}</p>
      <p style="margin:0 0 8px"><strong>From:</strong> ${escapeHtml(report.email || "(not given)")}</p>
      <p style="margin:16px 0 8px;font-weight:600">${escapeHtml(report.summary)}</p>
      <p style="margin:0">${escapeHtml(report.details).replaceAll("\n", "<br>")}</p>
    `,
    cta: awardUrl
      ? { label: `Award ${formatDots(BUG_REPORT_AWARD)}`, href: awardUrl }
      : null,
  });
}

export async function saveSiteBugReport(
  report: BugReportInput,
  userId: string | null,
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_bug_reports")
    .insert({
      summary: report.summary,
      details: report.details,
      email: report.email || null,
      page: report.page,
      user_id: userId,
    })
    .select("id")
    .single();
  if (error || !data?.id) {
    console.error("site_bug_reports insert failed", error?.message);
    return { ok: false as const, error: "Could not send just now. Try again." };
  }
  return { ok: true as const, id: data.id as string };
}

export async function sendBugReportEmail(
  report: BugReportInput,
  awardUrl?: string | null,
) {
  const mailed = await sendResendEmail({
    to: BUG_REPORT_TO,
    subject: `Dozen bug: ${report.summary}`.slice(0, 120),
    text: mailBody(report, awardUrl),
    html: mailHtml(report, awardUrl),
    replyTo: report.email || undefined,
  });
  if (!mailed.ok) {
    return { ok: false as const, error: mailed.error };
  }
  return { ok: true as const };
}
