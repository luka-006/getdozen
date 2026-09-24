import { SITE_ORIGIN } from "@/lib/app-url";
import { escapeHtml, renderMailLayout } from "@/lib/mail-layout";
import { ownerInbox } from "@/lib/mail-inbox";
import { sendResendEmail } from "@/lib/resend-mail";
import { createAdminClient } from "@/lib/supabase/admin";

export type PostReportInput = {
  reason: string;
  details: string;
  email: string;
  requestId: string;
  appName: string;
};

export function parsePostReport(
  formData: FormData,
  meta: { requestId: string; appName: string },
): PostReportInput | { error: string } {
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (reason.length < 4 || reason.length > 80) {
    return { error: "Pick a short reason (4 to 80 characters)." };
  }
  if (details.length < 8 || details.length > 2000) {
    return { error: "Add a bit more detail (8 to 2000 characters)." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "That email does not look valid." };
  }

  return {
    reason,
    details,
    email,
    requestId: meta.requestId,
    appName: meta.appName,
  };
}

export async function savePostReport(
  report: PostReportInput,
  userId: string | null,
) {
  const admin = createAdminClient();
  const page = `/requests/${report.requestId}`;
  const { data, error } = await admin
    .from("site_bug_reports")
    .insert({
      summary: `Post report: ${report.appName} (${report.reason})`.slice(0, 160),
      details: report.details,
      email: report.email || null,
      page,
      user_id: userId,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("post report insert failed", error?.message);
    return { ok: false as const, error: "Could not send just now. Try again." };
  }
  return { ok: true as const, id: data.id as string };
}

export async function sendPostReportEmail(report: PostReportInput) {
  const postUrl = `${SITE_ORIGIN}/requests/${report.requestId}`;
  const text = [
    `Post report on Dozen`,
    `App: ${report.appName}`,
    `Reason: ${report.reason}`,
    `From: ${report.email || "(not given)"}`,
    `Post: ${postUrl}`,
    "",
    report.details,
  ].join("\n");

  const html = renderMailLayout({
    title: "Post report",
    bodyHtml: `
      <p style="margin:0 0 8px"><strong>App:</strong> ${escapeHtml(report.appName)}</p>
      <p style="margin:0 0 8px"><strong>Reason:</strong> ${escapeHtml(report.reason)}</p>
      <p style="margin:0 0 8px"><strong>From:</strong> ${escapeHtml(report.email || "(not given)")}</p>
      <p style="margin:16px 0 0">${escapeHtml(report.details).replaceAll("\n", "<br>")}</p>
    `,
    cta: { label: "Open post", href: postUrl },
  });

  return sendResendEmail({
    to: ownerInbox(),
    subject: `Dozen post report: ${report.appName}`.slice(0, 120),
    text,
    html,
    replyTo: report.email || undefined,
  });
}
