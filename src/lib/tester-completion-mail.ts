import { SITE_ORIGIN } from "@/lib/app-url";
import { formatDotsDelta } from "@/lib/currency";
import { escapeHtml, renderMailLayout } from "@/lib/mail-layout";
import { sendResendEmail } from "@/lib/resend-mail";

type TesterCompletionMailInput = {
  to: string;
  appName: string;
  dotsEarned: number;
  commitmentId: string;
  makerName: string;
};

export function testerCompletionPageUrl(commitmentId: string) {
  return `${SITE_ORIGIN}/testers/complete/${commitmentId}`;
}

export async function sendTesterCompletionEmail(input: TesterCompletionMailInput) {
  const pageUrl = testerCompletionPageUrl(input.commitmentId);
  const walletUrl = `${SITE_ORIGIN}/wallet`;
  const dotsLabel = formatDotsDelta(input.dotsEarned);

  const text = [
    `You finished testing "${input.appName}" on Dozen.`,
    "",
    `${dotsLabel} added to your wallet.`,
    "",
    "How did the test go? Leave a quick note for the maker if you like:",
    pageUrl,
    "",
    `Wallet: ${walletUrl}`,
  ].join("\n");

  const html = renderMailLayout({
    title: "Test complete",
    bodyHtml: `
      <p style="margin:0 0 12px">You finished testing <strong>${escapeHtml(input.appName)}</strong>.</p>
      <p style="margin:0 0 12px"><strong>${escapeHtml(dotsLabel)}</strong> added to your wallet.</p>
      <p style="margin:0">How did the test go? You can share a quick rating and leave a peer note for <strong>${escapeHtml(input.makerName)}</strong> if you want — totally optional.</p>
    `,
    cta: {
      label: "Share feedback",
      href: pageUrl,
    },
    footerNote: `View your wallet at ${walletUrl}`,
  });

  return sendResendEmail({
    to: input.to,
    subject: `Test complete: ${input.appName}`,
    text,
    html,
  });
}
