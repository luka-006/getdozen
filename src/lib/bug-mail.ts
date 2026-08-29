import { bugAwardClickUrl } from "@/lib/bug-award-token";
import { createAdminClient } from "@/lib/supabase/admin";

import { sendResendEmail, supportInbox } from "@/lib/resend-mail";

export const BUG_REPORT_TO = supportInbox();

export type BugReportInput = {
  summary: string;
  details: string;
  email: string;
  page: string;
};

export type BugMailBrowserPayload = {
  url: string;
  body: Record<string, string>;
};

export function parseBugReport(formData: FormData): BugReportInput | { error: string } {
  const summary = String(formData.get("summary") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const page = String(formData.get("page") ?? "").trim().slice(0, 500);

  if (summary.length < 8 || summary.length > 160) {
    return { error: "Describe the bug in 8–160 characters." };
  }
  if (details.length < 12 || details.length > 4000) {
    return { error: "Add a bit more detail (12–4000 characters)." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "That email does not look valid." };
  }
  if (page && !page.startsWith("/")) {
    return { error: "Could not send just now. Try again." };
  }

  return { summary, details, email, page: page || "/" };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
    lines.push("", "If this is a proper report, click Award 2 credits:", awardUrl);
  }
  return lines.join("\n");
}

function mailHtml(report: BugReportInput, awardUrl?: string | null) {
  const award = awardUrl
    ? `<p><a href="${escapeHtml(awardUrl)}" style="display:inline-block;padding:10px 18px;background:#1E4FD8;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600">Award 2 credits</a></p>`
    : "";
  return [
    `<p><strong>Page:</strong> ${escapeHtml(report.page)}</p>`,
    `<p><strong>From:</strong> ${escapeHtml(report.email || "(not given)")}</p>`,
    `<p>${escapeHtml(report.summary)}</p>`,
    `<p>${escapeHtml(report.details).replaceAll("\n", "<br>")}</p>`,
    award,
  ].join("");
}

export function bugMailBrowserPayload(
  report: BugReportInput,
  awardUrl?: string | null,
): BugMailBrowserPayload {
  const subject = `Dozen bug: ${report.summary}`.slice(0, 120);
  return {
    url: `https://formsubmit.co/ajax/${encodeURIComponent(BUG_REPORT_TO)}`,
    body: {
      _subject: subject,
      _template: "box",
      _captcha: "false",
      ...(awardUrl
        ? {
            Award: awardUrl,
          }
        : {}),
      email: report.email || "noreply@getdozen.dev",
      page: report.page,
      message: mailBody(report, awardUrl),
    },
  };
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

async function sendFormSubmit(report: BugReportInput, awardUrl?: string | null) {
  const payload = bugMailBrowserPayload(report, awardUrl);
  const res = await fetch(payload.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload.body),
  });
  return res.ok;
}

export async function sendBugReportEmail(
  report: BugReportInput,
  awardUrl?: string | null,
) {
  const formOk = await sendFormSubmit(report, awardUrl).catch(() => false);
  if (formOk) return { ok: true as const };

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
