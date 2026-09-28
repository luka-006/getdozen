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
    "Welcome to Dozen — thanks for signing up.",
    "",
    `Your confirmation code is ${opts.code}.`,
    "",
    "It expires in one hour.",
    `Enter it at ${opts.confirmPageUrl}`,
    "",
    `Or confirm with one tap: ${opts.confirmUrl}`,
    "",
    "If you did not create this account, you can ignore this message.",
  ].join("\n");

  const html = renderMailLayout({
    title: "Confirm your email",
    bodyHtml: `<p style="margin:0 0 12px">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 20px;color:#475569">Welcome to Dozen — thanks for signing up. Enter this code to confirm your email:</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 20px;width:100%">
        <tr>
          <td align="center" style="padding:16px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
            <span style="font-size:34px;letter-spacing:0.32em;font-weight:700;font-family:ui-monospace,SFMono-Regular,monospace;color:#0b1f3a">${escapeHtml(opts.code)}</span>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;color:#475569">This code expires in one hour.</p>
      <p style="margin:0;color:#64748b;font-size:13px">Prefer one tap? Use the button below to confirm instantly.</p>`,
    cta: { label: "Confirm my email", href: opts.confirmUrl },
    footerNote:
      "you signed up for a Dozen account at getdozen.dev. If you did not create this account, you can safely ignore this email.",
  });

  return sendResendEmail({
    to: opts.to,
    subject: `${opts.code} is your Dozen confirmation code`,
    text,
    html,
  });
}
