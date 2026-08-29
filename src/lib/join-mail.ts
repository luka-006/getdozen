import { SITE_ORIGIN } from "@/lib/app-url";
import { sendResendEmail } from "@/lib/resend-mail";

type JoinMailInput = {
  to: string;
  appName: string;
  durationDays: number;
  optInLink?: string | null;
  requestId: string;
};

export async function sendJoinConfirmationEmail(input: JoinMailInput) {
  const requestUrl = `${SITE_ORIGIN}/requests/${input.requestId}`;
  const testersUrl = `${SITE_ORIGIN}/testers`;
  const optIn = input.optInLink?.trim();

  const text = [
    `You're signed up to test "${input.appName}" on Dozen.`,
    "",
    `Duration: ${input.durationDays} days. Check in on alternate days from My tests.`,
    "",
    optIn
      ? `Opt in today with the Play Console link on the post:`
      : `Open the post for tester details:`,
    optIn || requestUrl,
    "",
    `Track progress: ${testersUrl}`,
    `Post: ${requestUrl}`,
  ].join("\n");

  const html = [
    `<p>You're signed up to test <strong>${escapeHtml(input.appName)}</strong> on Dozen.</p>`,
    `<p>Duration: <strong>${input.durationDays} days</strong>. Check in on alternate days from <a href="${testersUrl}">My tests</a>.</p>`,
    optIn
      ? `<p><a href="${escapeHtml(optIn)}" style="display:inline-block;padding:10px 18px;background:#1E4FD8;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600">Opt in on Play Console</a></p>`
      : `<p><a href="${requestUrl}">Open the post</a> for tester details.</p>`,
    `<p style="font-size:13px;color:#666">Post: <a href="${requestUrl}">${requestUrl}</a></p>`,
  ].join("");

  return sendResendEmail({
    to: input.to,
    subject: `Tester signup: ${input.appName}`,
    text,
    html,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
