import { SITE_ORIGIN } from "@/lib/app-url";
import type { ProductType } from "@/lib/constants";
import {
  joinOptInButtonLabel,
  normalizePlatform,
} from "@/lib/platform-access";
import { joinMailProductLinkHint } from "@/lib/product-copy";
import { escapeHtml, renderMailLayout } from "@/lib/mail-layout";
import { sendResendEmail } from "@/lib/resend-mail";

type JoinMailInput = {
  to: string;
  appName: string;
  durationDays: number;
  optInLink?: string | null;
  requestId: string;
  platform?: string | null;
  productType?: ProductType | string | null;
};

export async function sendJoinConfirmationEmail(input: JoinMailInput) {
  const requestUrl = `${SITE_ORIGIN}/requests/${input.requestId}`;
  const testersUrl = `${SITE_ORIGIN}/testers`;
  const optIn = input.optInLink?.trim();
  const platform = normalizePlatform(input.platform);
  const optInLabel = joinOptInButtonLabel(platform, input.productType);

  const text = [
    `You're signed up to test "${input.appName}" on Dozen.`,
    "",
    `Duration: ${input.durationDays} days. Check in on alternate days from My tests.`,
    "",
    optIn
      ? `Install or opt in today (${optInLabel}):`
      : `Open the post and use the ${input.productType === "game" ? "game" : "app"} URL:`,
    optIn || requestUrl,
    "",
    `Track progress: ${testersUrl}`,
    `Post: ${requestUrl}`,
  ].join("\n");

  const html = renderMailLayout({
    title: "Tester signup confirmed",
    bodyHtml: `
      <p style="margin:0 0 12px">You're signed up to test <strong>${escapeHtml(input.appName)}</strong> on Dozen.</p>
      <p style="margin:0">Duration: <strong>${input.durationDays} days</strong>. Check in on alternate days from My tests.</p>
    `,
    cta: {
      label: optIn ? optInLabel : joinMailProductLinkHint(input.productType),
      href: optIn || requestUrl,
    },
    footerNote: `Track progress at ${testersUrl}`,
  });

  return sendResendEmail({
    to: input.to,
    subject: `Tester signup: ${input.appName}`,
    text,
    html,
  });
}
