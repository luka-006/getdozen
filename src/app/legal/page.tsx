import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalDoc,
  LegalEmailLink,
  LegalH,
  LegalOperatorNotice,
  LegalStackLinks,
  LegalUpdated,
} from "@/components/legal-doc";
import {
  COMPLAINT_RESPONSE_DAYS,
  LEGAL,
  LEGAL_PATHS,
} from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Legal",
  description: "Service-provider information for Dozen.",
  path: LEGAL_PATHS.notice,
});

export default function LegalPage() {
  return (
    <LegalDoc title="Legal notice">
      <LegalOperatorNotice />

      <p className="text-[14px] text-ink/70">
        Identification of the information-society service provider under
        Article 6 of the Croatian Electronic Commerce Act and pre-contract
        information under Croatian consumer law. For complaints write to{" "}
        <LegalEmailLink /> — we respond within {COMPLAINT_RESPONSE_DAYS} days.
      </p>

      <LegalH>Prices</LegalH>
      <p>
        Where prices are shown, they are in euro and are the amount payable
        unless a tax line is shown separately. There is no shipping. Payment
        is processed by Stripe. Credit packs and Pro are listed on the site
        before you pay. Paying is also covered by the{" "}
        <Link className="text-blue" href={LEGAL_PATHS.paymentTerms}>
          payment terms
        </Link>
        .
      </p>

      <LegalH>Dispute resolution</LegalH>
      <p>
        EU consumers may use the European Commission Online Dispute Resolution
        platform:{" "}
        <a className="text-blue" href={LEGAL.odrUrl} rel="noreferrer">
          {LEGAL.odrUrl}
        </a>
        .
      </p>

      <LegalH>Governing law</LegalH>
      <p>
        Croatian law applies. Mandatory consumer protections in your EU country
        of residence still apply. Courts of the {LEGAL.country} have
        jurisdiction, without limiting any non-waivable consumer forum rights.
      </p>

      <LegalH>Related documents</LegalH>
      <LegalStackLinks />

      <LegalUpdated />
    </LegalDoc>
  );
}
