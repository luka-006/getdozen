/** Operator identity for Croatian e-commerce Art. 6 + GDPR Art. 13. */
export const LEGAL = {
  brand: "Dozen",
  siteUrl: "https://getdozen.dev",
  country: "Republic of Croatia",
  email:
    process.env.LEGAL_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_LEGAL_EMAIL?.trim() ||
    "info@getdozen.dev",
  operatorName: process.env.LEGAL_OPERATOR_NAME?.trim() || "",
  address: process.env.LEGAL_ADDRESS?.trim() || "",
  oib: process.env.LEGAL_OIB?.trim() || "",
  vatId: process.env.LEGAL_VAT_ID?.trim() || "",
  register: process.env.LEGAL_REGISTER?.trim() || "",
  updated: "29 August 2026",
  azopUrl: "https://azop.hr",
  azopEmail: "azop@azop.hr",
  azopAddress: "Ulica Metela Ožegovića 16, 10000 Zagreb",
  azopComplaintUrl: "https://azop.hr/zahtjev-za-utvrdivanje-povrede-prava/",
  odrUrl: "https://ec.europa.eu/consumers/odr",
} as const;

/** Paths for the legal stack — keep cross-links consistent. */
export const LEGAL_PATHS = {
  terms: "/terms",
  paymentTerms: "/terms/payment",
  privacy: "/privacy",
  cookies: "/cookies",
  notice: "/legal",
} as const;

export const MIN_AGE = 16;
export const COMPLAINT_RESPONSE_DAYS = 15;
export const WITHDRAWAL_DAYS = 14;

/** Browser localStorage key — not a cookie; stores banner dismissal only. */
export const COOKIE_NOTICE_STORAGE_KEY = "dozen_cookie_notice";

export function hasFullLegalIdentity() {
  return Boolean(LEGAL.operatorName && LEGAL.address && LEGAL.email);
}
