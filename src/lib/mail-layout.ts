import { SITE_ORIGIN } from "@/lib/app-url";
import { SITE_EMAIL } from "@/lib/site-email";

/** Public PNG served by `src/app/apple-icon.tsx` — works in production email clients. */
const LOGO_URL = `${SITE_ORIGIN}/apple-icon`;

const FOOTER_LINKS = [
  { label: "Privacy", href: `${SITE_ORIGIN}/privacy` },
  { label: "Terms", href: `${SITE_ORIGIN}/terms` },
  { label: "Cookies", href: `${SITE_ORIGIN}/cookies` },
  { label: "Contact", href: `${SITE_ORIGIN}/contact` },
] as const;

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Shared Dozen HTML email shell with logo, card body, and policy footer. */
export function renderMailLayout(opts: {
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string } | null;
  /** Completes: "You received this email because …" */
  footerNote?: string;
}) {
  const cta = opts.cta
    ? `<p style="margin:28px 0 0;text-align:center">
        <a href="${escapeHtml(opts.cta.href)}"
           style="display:inline-block;padding:13px 24px;background:#1E4FD8;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;font-family:system-ui,-apple-system,sans-serif">
          ${escapeHtml(opts.cta.label)}
        </a>
      </p>`
    : "";

  const contextLine = opts.footerNote
    ? `<p style="margin:0 0 12px;font-size:12px;line-height:1.55;color:#64748b">You received this email because ${escapeHtml(opts.footerNote)}</p>`
    : "";

  const legalOperator = process.env.LEGAL_OPERATOR_NAME?.trim();
  const legalLine = legalOperator
    ? `<p style="margin:0 0 12px;font-size:11px;line-height:1.5;color:#94a3b8">${escapeHtml(legalOperator)}</p>`
    : "";

  const linkRow = FOOTER_LINKS.map(
    (link) =>
      `<a href="${escapeHtml(link.href)}" style="color:#64748b;text-decoration:underline">${escapeHtml(link.label)}</a>`,
  ).join('<span style="color:#cbd5e1;padding:0 6px">·</span>');

  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f6fb">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
          <tr>
            <td style="padding:28px 28px 12px;text-align:center;border-bottom:1px solid #f1f5f9">
              <img src="${LOGO_URL}" width="48" height="48" alt="Dozen" style="display:inline-block;border:0;border-radius:10px" />
              <p style="margin:10px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:17px;font-weight:700;color:#0b1f3a;letter-spacing:-0.02em">Dozen</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 28px;font-family:system-ui,-apple-system,sans-serif;color:#0b1f3a;font-size:15px;line-height:1.55">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#0b1f3a">${escapeHtml(opts.title)}</h1>
              ${opts.bodyHtml}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 24px;border-top:1px solid #f1f5f9;font-family:system-ui,-apple-system,sans-serif">
              ${contextLine}
              <p style="margin:0 0 12px;font-size:12px;line-height:1.6;text-align:center">${linkRow}</p>
              ${legalLine}
              <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;text-align:center">
                © ${year} Dozen · <a href="${SITE_ORIGIN}" style="color:#64748b;text-decoration:none">getdozen.dev</a> · <a href="mailto:${SITE_EMAIL}" style="color:#64748b;text-decoration:none">${escapeHtml(SITE_EMAIL)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function mailButtonHtml(label: string, href: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;background:#1E4FD8;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">${escapeHtml(label)}</a>`;
}
