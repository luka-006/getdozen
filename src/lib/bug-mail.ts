import { SITE_ORIGIN } from "@/lib/app-url";
import { createAdminClient } from "@/lib/supabase/admin";

export const BUG_REPORT_TO =
  process.env.BUG_REPORT_TO?.trim() || "luka.kasalo.web@gmail.com";

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

function mailBody(report: BugReportInput) {
  return [
    `Page: ${report.page}`,
    `From: ${report.email || "(not given)"}`,
    "",
    report.summary,
    "",
    report.details,
  ].join("\n");
}

export function bugMailBrowserPayload(report: BugReportInput): BugMailBrowserPayload {
  const subject = `Dozen bug: ${report.summary}`.slice(0, 120);
  return {
    url: `https://formsubmit.co/ajax/${encodeURIComponent(BUG_REPORT_TO)}`,
    body: {
      _subject: subject,
      _template: "box",
      _captcha: "false",
      _url: SITE_ORIGIN,
      email: report.email || "noreply@getdozen.dev",
      page: report.page,
      message: mailBody(report),
    },
  };
}

export async function saveSiteBugReport(
  report: BugReportInput,
  userId: string | null,
) {
  const admin = createAdminClient();
  const { error } = await admin.from("site_bug_reports").insert({
    summary: report.summary,
    details: report.details,
    email: report.email || null,
    page: report.page,
    user_id: userId,
  });
  if (error) {
    console.error("site_bug_reports insert failed", error.message);
    return { ok: false as const, error: "Could not send just now. Try again." };
  }
  return { ok: true as const };
}

export async function sendBugReportEmail(report: BugReportInput) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false as const, error: "No mailer configured." };

  const subject = `Dozen bug: ${report.summary}`.slice(0, 120);
  const from =
    process.env.BUG_REPORT_FROM?.trim() ||
    "Dozen <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [BUG_REPORT_TO],
      subject,
      text: mailBody(report),
      reply_to: report.email || undefined,
    }),
  });
  if (!res.ok) {
    return { ok: false as const, error: "Could not send just now. Try again." };
  }
  return { ok: true as const };
}
