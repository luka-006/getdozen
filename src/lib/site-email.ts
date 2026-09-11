/** Single public contact + mail identity for Dozen. */
export const SITE_EMAIL = "hello@getdozen.dev";

export function siteEmail() {
  return SITE_EMAIL;
}

export function resendFrom() {
  const custom = process.env.RESEND_FROM?.trim();
  if (custom) return custom;
  return `Dozen <${SITE_EMAIL}>`;
}
