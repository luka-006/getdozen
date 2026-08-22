import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalH } from "@/components/legal-doc";
import { CREDIT_EXPIRY_MONTHS } from "@/lib/constants";
import { LEGAL } from "@/lib/legal";
import { EUR_PER_CREDIT, PRO_PRICE_EUR } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Payment terms",
  description: "Payment, credits, Pro, refunds, and checkout terms for Dozen.",
  path: "/terms/payment",
});

export default function PaymentTermsPage() {
  return (
    <LegalDoc title="Payment terms">
      <p>
        These payment terms apply when you buy credit packs or Dozen Pro on{" "}
        {LEGAL.siteUrl}. They sit with the{" "}
        <Link className="text-blue" href="/terms">
          terms of use
        </Link>
        ,{" "}
        <Link className="text-blue" href="/privacy">
          privacy policy
        </Link>
        , and{" "}
        <Link className="text-blue" href="/legal">
          legal notice
        </Link>
        . By starting checkout you agree to this page.
      </p>

      <LegalH>What you can buy</LegalH>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Credits</strong> — a prepaid balance used on Dozen to post
          tester and feedback work. Packs and custom amounts are priced in
          euro. The list rate is €{EUR_PER_CREDIT} per credit; some packs are
          cheaper.
        </li>
        <li>
          <strong>Pro</strong> — a monthly subscription currently €{PRO_PRICE_EUR}
          / month, billed until you cancel. Benefits are shown on the pricing
          and wallet pages at the time you pay.
        </li>
      </ul>
      <p>
        Credits are not money, not e-money, and not withdrawable except as a
        refund we owe you under these terms or the law. They cannot be sold
        or transferred to another account.
      </p>

      <LegalH>Prices and taxes</LegalH>
      <p>
        Prices are shown in euro before you pay. Unless a tax line is shown
        separately at checkout, the amount on the button is what you pay.
        There is no shipping. Invoices and receipts come from Stripe.
      </p>

      <LegalH>How payment works</LegalH>
      <p>
        Checkout is Stripe-hosted. We do not see or store full card numbers,
        CVC, or expiry. Stripe is the payment service provider. The purchase
        contract is formed when Stripe confirms the payment to our server —
        not when the browser returns from checkout. Credits and Pro are
        granted only after that confirmation.
      </p>
      <p>
        If a payment is declined, delayed, or reversed, we do not supply the
        credits or Pro until funds are confirmed. Chargebacks may freeze or
        reverse the matching credits or Pro period.
      </p>

      <LegalH>Immediate supply and withdrawal</LegalH>
      <p>
        EU / Croatian consumers normally have 14 days to withdraw from a
        distance contract. Credits and Pro are digital services supplied
        immediately after payment. By completing checkout you ask us to
        supply at once and accept that the 14-day withdrawal right ends once
        supply begins, as allowed for digital content and digital services.
        If we have not yet added the credits or activated Pro, email{" "}
        <a className="text-blue" href={`mailto:${LEGAL.email}`}>
          {LEGAL.email}
        </a>{" "}
        and we will cancel.
      </p>

      <LegalH>Refunds</LegalH>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Unused purchased credits may be refunded within 14 days of purchase
          if they have not been spent.
        </li>
        <li>
          Spent credits, finished reviews, and tester commitments are not
          refundable except where the service was not supplied or Croatian /
          EU law requires a refund.
        </li>
        <li>
          Pro can be cancelled at period end in the Stripe billing portal
          (Wallet → Manage billing). Unless a mandatory rule says otherwise,
          the current period is not refunded after it has started.
        </li>
      </ul>
      <p>
        Purchased credits expire {CREDIT_EXPIRY_MONTHS} months after they
        become available, unless a longer period is required by law.
      </p>

      <LegalH>Subscriptions</LegalH>
      <p>
        Pro renews monthly at the then-current price until you cancel.
        Cancellation stops the next renewal; you keep Pro until the end of
        the period already paid. Failed subscription payments may retry
        through Stripe and then end Pro access.
      </p>

      <LegalH>Contact</LegalH>
      <p>
        Billing questions:{" "}
        <a className="text-blue" href={`mailto:${LEGAL.email}`}>
          {LEGAL.email}
        </a>
        . Complaints are answered within 15 days. EU ODR:{" "}
        <a className="text-blue" href={LEGAL.odrUrl} rel="noreferrer">
          {LEGAL.odrUrl}
        </a>
        . Croatian law applies; mandatory consumer rights in your home EU
        state still apply.
      </p>

      <p className="font-mono text-[12px] text-ink/45">
        Last updated {LEGAL.updated}
      </p>
    </LegalDoc>
  );
}
