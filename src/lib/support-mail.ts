import { escapeHtml, renderMailLayout } from "@/lib/mail-layout";
import { sendResendEmail, supportInbox } from "@/lib/resend-mail";

export type SupportInput = {
  subject: string;
  message: string;
  email: string;
  page: string;
};

export function parseSupportMessage(formData: FormData): SupportInput | { error: string } {
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const page = String(formData.get("page") ?? "").trim().slice(0, 500);

  if (subject.length < 4 || subject.length > 120) {
    return { error: "Subject needs 4–120 characters." };
  }
  if (message.length < 12 || message.length > 4000) {
    return { error: "Message needs 12–4000 characters." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email so we can reply." };
  }
  if (page && !page.startsWith("/")) {
    return { error: "Could not send just now. Try again." };
  }

  return { subject, message, email, page: page || "/" };
}

export async function sendSupportEmail(input: SupportInput) {
  const inbox = supportInbox();
  const text = [
    `From: ${input.email}`,
    `Page: ${input.page}`,
    "",
    input.message,
  ].join("\n");

  const html = renderMailLayout({
    title: input.subject,
    bodyHtml: `
      <p style="margin:0 0 8px"><strong>From:</strong> ${escapeHtml(input.email)}</p>
      <p style="margin:0 0 16px"><strong>Page:</strong> ${escapeHtml(input.page)}</p>
      <p style="margin:0">${escapeHtml(input.message).replaceAll("\n", "<br>")}</p>
    `,
  });

  return sendResendEmail({
    to: inbox,
    subject: `Dozen support: ${input.subject}`,
    text,
    html,
    replyTo: input.email,
  });
}
