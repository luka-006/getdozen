import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalH } from "@/components/legal-doc";
import { LEGAL } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms",
  description: "Terms of use for Dozen.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of use">
      <p>
        These terms govern use of {LEGAL.siteUrl} (“Dozen”). The provider is
        identified on the{" "}
        <Link className="text-blue" href="/legal">
          legal notice
        </Link>
        . By joining the waitlist or creating an account you agree to these
        terms. If you do not agree, do not use the service.
      </p>

      <LegalH>The service</LegalH>
      <p>
        Dozen is a marketplace for structured app feedback and closed tests
        among other makers. During the waitlist phase the public site only
        collects a confirmed email so we can write when Dozen opens.
      </p>

      <LegalH>Accounts and waitlist</LegalH>
      <p>
        You must be 16 or older. Keep your login to yourself. We may refuse
        or close an account that is abusive, fraudulent, or illegal. Waitlist
        confirmation is given by the email we send; unconfirmed addresses are
        not treated as subscribed.
      </p>

      <LegalH>Credits, Pro, and prices</LegalH>
      <p>
        Credits are a prepaid balance for posting work on Dozen. They are not
        cash, not a stored-value instrument, and not transferable out of the
        service except as a refund we owe you under these terms or the law.
        Pack prices and Pro are shown in euro before payment. Stripe handles
        the charge. Credits are added only after Stripe confirms payment to
        our server — never because the browser returned from checkout. Full
        payment rules:{" "}
        <Link className="text-blue" href="/terms/payment">
          payment terms
        </Link>
        .
      </p>

      <LegalH>Withdrawal (EU / Croatian consumers)</LegalH>
      <p>
        You normally have 14 days to withdraw from a distance contract
        (Croatian Consumer Protection Act). Credits and Pro are digital
        services supplied immediately after payment. By completing checkout
        you request immediate supply and acknowledge that you lose the
        14-day withdrawal right once supply begins, as allowed for digital
        content and digital services. If we have not yet supplied the
        credits or activated Pro, you may still withdraw by emailing{" "}
        <a className="text-blue" href={`mailto:${LEGAL.email}`}>
          {LEGAL.email}
        </a>
        .
      </p>
      <p>
        Unused purchased credits may be refunded on request within 14 days of
        purchase if they have not been spent. Spent credits, completed
        reviews, and tester commitments are not refundable except where the
        service was not supplied or Croatian / EU law requires it. Pro
        cancels at period end through the Stripe billing portal unless a
        mandatory rule says otherwise.
      </p>

      <LegalH>Your content</LegalH>
      <p>
        You keep rights in what you post. You grant us a licence to host and
        display it as needed to run Dozen. Do not post unlawful content,
        malware, or other people’s personal data without a basis. Guest
        logins you share with reviewers must be throwaway accounts.
      </p>

      <LegalH>Our role</LegalH>
      <p>
        We host the marketplace. We are not a party to the apps you test and
        we do not guarantee outcomes, store rankings, or that a review is
        correct. We may remove content that breaks these terms.
      </p>

      <LegalH>Liability</LegalH>
      <p>
        Nothing here limits liability that Croatian or EU law does not allow
        to be limited (including death or personal injury caused by
        negligence, or fraud). For other losses, and to the extent allowed,
        we are not liable for indirect loss, and our aggregate liability in
        a year is limited to the amount you paid us in that year.
      </p>

      <LegalH>Complaints and law</LegalH>
      <p>
        Complaints: {LEGAL.email}, answer within 15 days. EU ODR:{" "}
        <a className="text-blue" href={LEGAL.odrUrl} rel="noreferrer">
          {LEGAL.odrUrl}
        </a>
        . Croatian law; mandatory consumer rights in your home EU state still
        apply. Personal data:{" "}
        <Link className="text-blue" href="/privacy">
          privacy policy
        </Link>
        .
      </p>

      <p className="font-mono text-[12px] text-ink/45">
        Last updated {LEGAL.updated}
      </p>
    </LegalDoc>
  );
}
