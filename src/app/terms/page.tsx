import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalDoc,
  LegalEmailLink,
  LegalH,
  LegalStackLinks,
  LegalUpdated,
} from "@/components/legal-doc";
import {
  COMPLAINT_RESPONSE_DAYS,
  LEGAL,
  LEGAL_PATHS,
  MIN_AGE,
  WITHDRAWAL_DAYS,
} from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms",
  description: "Terms of use for Dozen.",
  path: LEGAL_PATHS.terms,
});

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of use">
      <p>
        These terms govern use of {LEGAL.siteUrl} (“Dozen”). The provider is
        identified on the{" "}
        <Link className="text-blue" href={LEGAL_PATHS.notice}>
          legal notice
        </Link>
        . By joining the waitlist or creating an account you agree to these
        terms. If you do not agree, do not use the service.
      </p>

      <LegalH>The service</LegalH>
      <p>
        Dozen is a marketplace for structured app feedback and closed tests
        among other makers. Before public launch, the homepage may only offer
        a waitlist that collects a confirmed email so we can write when Dozen
        opens. After launch, signed-in users can post work, review apps, join
        tester programs, and buy credits or Pro.
      </p>

      <LegalH>Accounts and waitlist</LegalH>
      <p>
        You must be {MIN_AGE} or older. Keep your login to yourself. We may
        refuse or close an account that is abusive, fraudulent, or illegal.
        Waitlist confirmation is given by the email we send; unconfirmed
        addresses are not treated as subscribed.
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
        <Link className="text-blue" href={LEGAL_PATHS.paymentTerms}>
          payment terms
        </Link>
        .
      </p>

      <LegalH>Tester programs</LegalH>
      <p>
        Closed tests require you to opt in through the poster&apos;s test
        track (for example Google Play), check in on alternating days during
        the test period, and submit a final review when the period ends.
        Missing too many check-ins voids the commitment without tester
        credits. Free accounts may run one active test at a time; Pro allows
        more, as shown in the product. You must use a real Google account
        email for each test; duplicate or shared accounts across profiles are
        not allowed. Gaming check-ins or other abuse can lead to a permanent
        ban.
      </p>

      <LegalH>Withdrawal (EU / Croatian consumers)</LegalH>
      <p>
        You normally have {WITHDRAWAL_DAYS} days to withdraw from a distance
        contract (Croatian Consumer Protection Act). Credits and Pro are
        digital services supplied immediately after payment. By completing
        checkout you request immediate supply and acknowledge that you lose
        the {WITHDRAWAL_DAYS}-day withdrawal right once supply begins, as
        allowed for digital content and digital services. If we have not yet
        supplied the credits or activated Pro, you may still withdraw by
        emailing <LegalEmailLink />.
      </p>
      <p>
        Unused purchased credits may be refunded on request within{" "}
        {WITHDRAWAL_DAYS} days of purchase if they have not been spent. Spent
        credits, completed reviews, activated board boosts, and tester
        commitments are not refundable except where the service was not
        supplied or Croatian / EU law requires it. Pro cancels at period end
        through the Stripe billing portal unless a mandatory rule says
        otherwise.
      </p>

      <LegalH>Your content</LegalH>
      <p>
        You keep rights in what you post. You grant us a licence to host and
        display it as needed to run Dozen. Do not post unlawful content,
        malware, or other people&apos;s personal data without a basis. Guest
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
        Complaints: <LegalEmailLink />, answer within{" "}
        {COMPLAINT_RESPONSE_DAYS} days. EU ODR:{" "}
        <a className="text-blue" href={LEGAL.odrUrl} rel="noreferrer">
          {LEGAL.odrUrl}
        </a>
        . Croatian law; mandatory consumer rights in your home EU state still
        apply. Personal data:{" "}
        <Link className="text-blue" href={LEGAL_PATHS.privacy}>
          privacy policy
        </Link>
        . Cookies:{" "}
        <Link className="text-blue" href={LEGAL_PATHS.cookies}>
          cookie notice
        </Link>
        .
      </p>

      <LegalStackLinks />
      <LegalUpdated />
    </LegalDoc>
  );
}
