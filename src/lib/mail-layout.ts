import { SITE_ORIGIN } from "@/lib/app-url";

const LOGO_URL = `${SITE_ORIGIN}/logo-dozen.png`;

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Shared Dozen HTML email shell with logo and CTA support. */
export function renderMailLayout(opts: {
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string } | null;
  footerNote?: string;
}) {
  const cta = opts.cta
    ? `<p style="margin:28px 0 8px">
        <a href="${escapeHtml(opts.cta.href)}"
           style="display:inline-block;padding:12px 22px;background:#1E4FD8;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;font-family:system-ui,-apple-system,sans-serif">
          ${escapeHtml(opts.cta.label)}
        </a>
      </p>`
    : "";

  const footer = opts.footerNote
    ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#64748b">${escapeHtml(opts.footerNote)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f6fb">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center">
              <img src="${LOGO_URL}" width="48" height="48" alt="Dozen" style="display:inline-block;border:0" />
              <p style="margin:12px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:18px;font-weight:700;color:#0b1f3a;letter-spacing:-0.02em">Dozen</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 32px;font-family:system-ui,-apple-system,sans-serif;color:#0b1f3a;font-size:15px;line-height:1.55">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#0b1f3a">${escapeHtml(opts.title)}</h1>
              ${opts.bodyHtml}
              ${cta}
              ${footer}
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:11px;color:#94a3b8">
          getdozen.dev · ${escapeHtml("hello@getdozen.dev")}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function mailButtonHtml(label: string, href: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;background:#1E4FD8;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">${escapeHtml(label)}</a>`;
}
