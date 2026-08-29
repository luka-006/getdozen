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
import { LEGAL, LEGAL_PATHS, MIN_AGE } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description: "How Dozen processes personal data under the GDPR.",
  path: LEGAL_PATHS.privacy,
});

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy policy">
      <LegalOperatorNotice />
      <p>
        This notice is given under Articles 13 and 14 of the EU General Data
        Protection Regulation (GDPR) and the Croatian Act Implementing the
        GDPR. We do not appoint a data-protection officer. We do not sell
        personal data. We do not run advertising or analytics cookies.
      </p>

      <LegalH>What we process</LegalH>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Waitlist:</strong> email, confirmation time, and when you
          asked to join.
        </li>
        <li>
          <strong>Account:</strong> email, display name, avatar if you add one,
          login identifiers from email or Google.
        </li>
        <li>
          <strong>Use of the product:</strong> posts, reviews, tester
          check-ins, the Google account email you give for a closed test,
          messages you send other users, and credit-ledger rows needed to run
          the marketplace.
        </li>
        <li>
          <strong>Payments:</strong> we receive Stripe customer and session
          identifiers, payment status, and pack/subscription/boost metadata. We
          do not store full card numbers.
        </li>
        <li>
          <strong>Transactional email:</strong> your email when we send board
          boost offers or other service messages you can opt out of where the
          law allows.
        </li>
        <li>
          <strong>Security:</strong> IP address and basic request metadata
          processed by our host for abuse prevention and delivery.
        </li>
        <li>
          <strong>Bug reports:</strong> what you type in the report form, the
          page you were on, and an email if you add one. We store these in our
          database and email them to the operator so we can fix the product.
        </li>
        <li>
          <strong>Operator administration:</strong> authorised staff access
          user, waitlist, payment, and bug-report records through a protected
          admin console for support, moderation, and billing.
        </li>
      </ul>

      <LegalH>Why, and on what legal basis</LegalH>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Waitlist and launch email</strong> — your consent (Art.
          6(1)(a)). You can withdraw it by writing to {LEGAL.email}. Withdrawal
          does not affect processing already done.
        </li>
        <li>
          <strong>Account, board, reviews, tester slots, credits, checkout</strong>{" "}
          — performance of a contract (Art. 6(1)(b)).
        </li>
        <li>
          <strong>Invoices, tax, and dispute records</strong> — legal
          obligation (Art. 6(1)(c)), including Croatian bookkeeping rules.
        </li>
        <li>
          <strong>Fraud, abuse, and keeping the service up</strong> —
          legitimate interests (Art. 6(1)(f)). You may object; we stop unless
          we have compelling grounds or need the data for a legal claim.
        </li>
      </ul>

      <LegalH>Who we use (processors)</LegalH>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Supabase</strong> — database, authentication, and
          confirmation emails.
        </li>
        <li>
          <strong>Stripe</strong> — checkout, cards, and subscriptions. Stripe
          is an independent controller for much of the payment data it
          collects. See Stripe&apos;s privacy notice.
        </li>
        <li>
          <strong>Vercel</strong> — hosting and delivery of this website.
        </li>
        <li>
          <strong>Resend</strong> — transactional email (bug-report alerts,
          board-boost offers, and similar service mail when configured).
        </li>
        <li>
          <strong>FormSubmit</strong> — alternative path for delivering
          bug-report emails to the operator when Resend is not configured.
        </li>
        <li>
          <strong>Google</strong> — only if you choose “Continue with Google”,
          or when you sign in to a poster&apos;s Google Play test track as part
          of a tester program.
        </li>
        <li>
          <strong>Cloudflare</strong> — DNS for getdozen.dev, and Turnstile
          bot checks on sign-in, signup, password reset, waitlist, and bug
          report forms. Turnstile is used only to tell humans from automated
          clients (legitimate interests, Art. 6(1)(f)).
        </li>
      </ul>
      <p>
        Some of these providers may process data outside the EEA. Where that
        happens we rely on an adequacy decision or the European Commission&apos;s
        Standard Contractual Clauses, plus the provider&apos;s extra safeguards.
      </p>

      <LegalH>How long we keep data</LegalH>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Waitlist: until you withdraw consent, or until 24 months after
          launch if you never open an account.
        </li>
        <li>Account and product data: while the account is open.</li>
        <li>
          After deletion we keep only what Croatian or EU law still requires
          (typically payment and accounting records, up to 11 years).
        </li>
        <li>Auth cookies last for the session length set by Supabase.</li>
      </ul>

      <LegalH>Your rights</LegalH>
      <p>
        You may request access, rectification, erasure, restriction,
        portability, and — where we rely on legitimate interests or consent —
        objection or withdrawal. Ask at <LegalEmailLink />. We reply without
        undue delay and within one month (extendable as the GDPR allows).
      </p>
      <p>
        You may lodge a complaint with the Croatian Personal Data Protection
        Agency (AZOP), {LEGAL.azopAddress}; {LEGAL.azopEmail};{" "}
        <a className="text-blue" href={LEGAL.azopUrl} rel="noreferrer">
          {LEGAL.azopUrl}
        </a>
        ; or the form at{" "}
        <a className="text-blue" href={LEGAL.azopComplaintUrl} rel="noreferrer">
          azop.hr/zahtjev-za-utvrdivanje-povrede-prava
        </a>
        . You may also complain to the authority in your EU country of
        residence.
      </p>

      <LegalH>Children</LegalH>
      <p>
        Dozen is for people {MIN_AGE} or older (Croatia&apos;s GDPR age of
        digital consent). We do not knowingly take waitlist or account data from
        children under {MIN_AGE}.
      </p>

      <LegalH>Automated decisions</LegalH>
      <p>
        We do not make decisions that produce legal or similarly significant
        effects solely by automated means (GDPR Art. 22).
      </p>

      <LegalH>Cookies</LegalH>
      <p>
        Only cookies needed to run the site and keep you signed in. A short
        notice explains this on first visit. Details:{" "}
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
