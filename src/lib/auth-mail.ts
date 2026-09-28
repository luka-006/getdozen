import { escapeHtml, renderMailLayout } from "@/lib/mail-layout";
import { sendResendEmail } from "@/lib/resend-mail";

export async function sendSignupConfirmEmail(opts: {
  to: string;
  confirmUrl: string;
  displayName?: string;
}) {
  const name = opts.displayName?.trim() || "there";
  const text = [
    `Hi ${name},`,
    "",
    "Welcome to Dozen — thanks for signing up.",
    "",
    "Confirm your account with the link below. It expires in one hour.",
    "",
    opts.confirmUrl,
    "",
    "If you did not create this account, you can ignore this message.",
  ].join("\n");

  const html = renderMailLayout({
    title: "Confirm your email",
    bodyHtml: `<p style="margin:0 0 12px">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 12px;color:#475569">Welcome to Dozen — thanks for signing up.</p>
      <p style="margin:0;color:#475569">Tap the button below to confirm your account. The link expires in one hour.</p>`,
    cta: { label: "Confirm my email", href: opts.confirmUrl },
    footerNote:
      "you signed up for a Dozen account at getdozen.dev. If you did not create this account, you can safely ignore this email.",
  });

  return sendResendEmail({
    to: opts.to,
    subject: "Confirm your Dozen account",
    text,
    html,
  });
}
