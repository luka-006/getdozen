import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalH } from "@/components/legal-doc";
import { LEGAL, hasFullLegalIdentity } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Legal",
  description: "Service-provider information for Dozen.",
  path: "/legal",
});

export default function LegalPage() {
  return (
    <LegalDoc title="Legal notice">
      <p>
        Required identification of the information-society service provider
        under Article 6 of the Croatian Electronic Commerce Act (Zakon o
        elektroničkoj trgovini) and pre-contract information under Croatian
        consumer law.
      </p>

      <LegalH>Provider</LegalH>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <span className="text-ink/55">Name / company: </span>
          {LEGAL.operatorName || "To be published before paid launch"}
        </li>
        <li>
          <span className="text-ink/55">Seat: </span>
          {LEGAL.address || `Established in the ${LEGAL.country}`}
        </li>
        <li>
          <span className="text-ink/55">Email: </span>
          <a className="text-blue" href={`mailto:${LEGAL.email}`}>
            {LEGAL.email}
          </a>
        </li>
        <li>
          <span className="text-ink/55">Website: </span>
          <a className="text-blue" href={LEGAL.siteUrl}>
            {LEGAL.siteUrl}
          </a>
        </li>
        {LEGAL.register ? (
          <li>
            <span className="text-ink/55">Register: </span>
            {LEGAL.register}
          </li>
        ) : null}
        {LEGAL.oib ? (
          <li>
            <span className="text-ink/55">OIB: </span>
            {LEGAL.oib}
          </li>
        ) : null}
        <li>
          <span className="text-ink/55">VAT: </span>
          {LEGAL.vatId ||
            "Shown here if the operator is registered for VAT"}
        </li>
      </ul>
      {!hasFullLegalIdentity() ? (
        <p className="text-[14px] text-ink/60">
          Full registered name, seat and OIB will appear here as soon as the
          operator is entered in the Croatian register. Until then, use the
          email above for any contact required by law.
        </p>
      ) : null}

      <LegalH>Prices</LegalH>
      <p>
        Where prices are shown, they are in euro and are the amount payable
        unless a tax line is shown separately. There is no shipping. Payment
        is processed by Stripe. Credit packs and Pro are listed on the site
        before you pay. Paying is also covered by the{" "}
        <Link className="text-blue" href="/terms/payment">
          payment terms
        </Link>
        .
      </p>

      <LegalH>Complaints</LegalH>
      <p>
        Write to{" "}
        <a className="text-blue" href={`mailto:${LEGAL.email}`}>
          {LEGAL.email}
        </a>
        . We answer written consumer complaints within 15 days of receipt
        (Croatian Consumer Protection Act).
      </p>

      <LegalH>Dispute resolution</LegalH>
      <p>
        EU consumers may use the European Commission Online Dispute Resolution
        platform:{" "}
        <a className="text-blue" href={LEGAL.odrUrl} rel="noreferrer">
          {LEGAL.odrUrl}
        </a>
        . We are not obliged to use a specific alternative-dispute body unless
        a binding rule says so.
      </p>

      <LegalH>Governing law</LegalH>
      <p>
        Croatian law applies. Mandatory consumer protections in your EU country
        of residence still apply. Courts of the {LEGAL.country} have
        jurisdiction, without limiting any non-waivable consumer forum rights.
      </p>

      <p className="font-mono text-[12px] text-ink/45">
        Last updated {LEGAL.updated}
      </p>
    </LegalDoc>
  );
}
