import { ownerInbox } from "@/lib/mail-inbox";
import { resendFrom, siteEmail } from "@/lib/site-email";

const RESEND_API = "https://api.resend.com/emails";

export function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function resendFromAddress() {
  return resendFrom();
}

export function supportInbox() {
  return ownerInbox();
}

export async function sendResendEmail(opts: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false as const, error: "No mailer configured." };

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromAddress(),
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject.slice(0, 200),
      text: opts.text,
      html: opts.html,
      reply_to: opts.replyTo || undefined,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Resend send failed", res.status, detail.slice(0, 200));
    return { ok: false as const, error: "Could not send email just now." };
  }
  return { ok: true as const };
}
