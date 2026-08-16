/** Operator identity for Croatian e-commerce Art. 6 + GDPR Art. 13. */
export const LEGAL = {
  brand: "Dozen",
  siteUrl: "https://getdozen.dev",
  country: "Republic of Croatia",
  email:
    process.env.LEGAL_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_LEGAL_EMAIL?.trim() ||
    "hello@getdozen.dev",
  operatorName: process.env.LEGAL_OPERATOR_NAME?.trim() || "",
  address: process.env.LEGAL_ADDRESS?.trim() || "",
  oib: process.env.LEGAL_OIB?.trim() || "",
  vatId: process.env.LEGAL_VAT_ID?.trim() || "",
  register: process.env.LEGAL_REGISTER?.trim() || "",
  updated: "16 August 2026",
  azopUrl: "https://azop.hr",
  azopEmail: "azop@azop.hr",
  azopAddress: "Ulica Metela Ožegovića 16, 10000 Zagreb",
  azopComplaintUrl: "https://azop.hr/zahtjev-za-utvrdivanje-povrede-prava/",
  odrUrl: "https://ec.europa.eu/consumers/odr",
};

export function hasFullLegalIdentity() {
  return Boolean(LEGAL.operatorName && LEGAL.address && LEGAL.email);
}
