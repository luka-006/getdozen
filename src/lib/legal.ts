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
  /** e.g. paušalni obrt — shown in the ownership line when set. */
  businessForm: process.env.LEGAL_BUSINESS_FORM?.trim() || "",
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
  return Boolean(
    LEGAL.operatorName && LEGAL.address && LEGAL.email && LEGAL.oib,
  );
}

type OperatorLineInput = {
  brand: string;
  siteUrl: string;
  operatorName: string;
  businessForm?: string;
  address: string;
  country: string;
  oib: string;
  email: string;
  vatId?: string;
  register?: string;
};

export function formatOperatorOwnershipLine(input: OperatorLineInput): string {
  const operator = input.businessForm
    ? `${input.operatorName} (${input.businessForm})`
    : input.operatorName;

  const parts = [
    operator,
    input.address,
    input.country,
    `OIB ${input.oib}`,
  ];
  if (input.vatId) parts.push(`PDV ${input.vatId}`);
  if (input.register) parts.push(input.register);

  return `The brand “${input.brand}” and ${input.siteUrl} are operated by ${parts.join(", ")}. Contact: ${input.email}.`;
}

/**
 * One-line operator notice (Art. 6 e-commerce + GDPR controller id).
 */
export function operatorOwnershipLine(): string | null {
  if (!hasFullLegalIdentity()) return null;
  return formatOperatorOwnershipLine({
    brand: LEGAL.brand,
    siteUrl: LEGAL.siteUrl,
    operatorName: LEGAL.operatorName,
    businessForm: LEGAL.businessForm || undefined,
    address: LEGAL.address,
    country: LEGAL.country,
    oib: LEGAL.oib,
    email: LEGAL.email,
    vatId: LEGAL.vatId || undefined,
    register: LEGAL.register || undefined,
  });
}
