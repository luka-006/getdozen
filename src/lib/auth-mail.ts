import { SITE_ORIGIN } from "@/lib/app-url";
import { escapeHtml, renderMailLayout } from "@/lib/mail-layout";
import { sendResendEmail } from "@/lib/resend-mail";

export async function sendSignupConfirmEmail(opts: {
  to: string;
  confirmUrl: string;
  code: string;
  confirmPageUrl: string;
  displayName?: string;
}) {
  const name = opts.displayName?.trim() || "there";
  const text = [
    `Hi ${name},`,
    "",
    `Your Dozen confirmation code is ${opts.code}.`,
    "",
    "It expires in one hour.",
    `Enter it at ${opts.confirmPageUrl}`,
    "",
    `Or confirm with one tap: ${opts.confirmUrl}`,
    "",
    "If you did not create this account, ignore this message.",
  ].join("\n");

  const html = renderMailLayout({
    title: "Confirm your email",
    bodyHtml: `<p style="margin:0 0 12px">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 16px;font-size:32px;letter-spacing:0.28em;font-weight:700;font-family:ui-monospace,monospace;color:#0b1f3a">${escapeHtml(opts.code)}</p>
      <p style="margin:0 0 12px;color:#475569">Enter this code on getdozen.dev. It expires in one hour.</p>
      <p style="margin:0;color:#64748b;font-size:13px">Prefer one tap? Use the button below instead.</p>`,
    cta: { label: "Confirm email", href: opts.confirmUrl },
    footerNote: "If you did not create this account, ignore this message.",
  });

  return sendResendEmail({
    to: opts.to,
    subject: `${opts.code} is your Dozen confirmation code`,
    text,
    html,
  });
}

export async function sendLoginCodeEmail(opts: {
  to: string;
  code: string;
}) {
  const loginUrl = `${SITE_ORIGIN}/login`;
  const text = [
    `Your Dozen sign-in code is ${opts.code}.`,
    "",
    "It expires in one hour.",
    `Enter it at ${loginUrl}`,
  ].join("\n");

  const html = renderMailLayout({
    title: "Your sign-in code",
    bodyHtml: `<p style="margin:0 0 16px;font-size:32px;letter-spacing:0.28em;font-weight:700;font-family:ui-monospace,monospace;color:#0b1f3a">${escapeHtml(opts.code)}</p>
      <p style="margin:0;color:#475569">Enter this code on getdozen.dev. It expires in one hour.</p>`,
    cta: { label: "Open sign-in", href: loginUrl },
  });

  return sendResendEmail({
    to: opts.to,
    subject: `${opts.code} is your Dozen code`,
    text,
    html,
  });
}
