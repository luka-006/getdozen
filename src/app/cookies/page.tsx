import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalDoc,
  LegalH,
  LegalStackLinks,
  LegalUpdated,
} from "@/components/legal-doc";
import {
  COOKIE_NOTICE_STORAGE_KEY,
  LEGAL,
  LEGAL_PATHS,
} from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Cookies",
  description: "Cookie use on getdozen.dev.",
  path: LEGAL_PATHS.cookies,
});

export default function CookiesPage() {
  return (
    <LegalDoc title="Cookie notice">
      <p>
        Croatian electronic-communications law (transposing the ePrivacy
        Directive) and the GDPR apply. Consent is required before any
        non-essential cookie is stored. Dozen currently sets{" "}
        <strong>only strictly necessary cookies</strong> on getdozen.dev. There
        is no analytics, advertising, or social-pixel cookie. A short notice on
        first visit explains this; you can dismiss it with OK.
      </p>

      <LegalH>What we set on getdozen.dev</LegalH>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Supabase session cookies</strong> — keep a signed-in session
          after email, Google, or a waitlist confirmation. Without them login
          and the confirmation flow cannot work.
        </li>
        <li>
          <strong>dozen_auth_next</strong> — short-lived, stores the path to
          return to after sign-in.
        </li>
        <li>
          <strong>Host / security cookies</strong> set by Vercel or Cloudflare
          solely to deliver the site (for example bot or TLS cookies).
        </li>
        <li>
          <strong>Cloudflare Turnstile</strong> — a short-lived challenge
          cookie used only on account, waitlist, and bug-report forms to stop
          bots. It is not used for advertising.
        </li>
      </ul>
      <p>
        These fall under the “strictly necessary” exception. Legal basis for
        related personal data is contract or the steps you ask us to take
        (GDPR Art. 6(1)(b)), or our interest in running a secure site (Art.
        6(1)(f)).
      </p>

      <LegalH>Stripe checkout</LegalH>
      <p>
        When you pay, Stripe hosts checkout on stripe.com. Stripe may set its
        own cookies there to process the payment and prevent fraud. Those
        cookies are controlled by Stripe under its privacy notice, not by this
        page.
      </p>

      <LegalH>What we do not set</LegalH>
      <p>
        No Google Analytics, Meta pixel, advertising IDs, or optional
        preference cookies on getdozen.dev. If that changes, we will add a
        consent choice before any optional cookie is stored, and we will update
        this notice.
      </p>

      <LegalH>Banner preference (not a cookie)</LegalH>
      <p>
        Dismissing the first-visit banner stores{" "}
        <code className="font-mono text-[13px]">{COOKIE_NOTICE_STORAGE_KEY}</code>{" "}
        in your browser&apos;s local storage so we do not show the banner again.
        That value is not sent to our servers.
      </p>

      <LegalH>How to delete them</LegalH>
      <p>
        Use your browser settings to clear cookies for getdozen.dev. That signs
        you out. More on personal data:{" "}
        <Link className="text-blue" href={LEGAL_PATHS.privacy}>
          privacy policy
        </Link>
        .
      </p>

      <LegalStackLinks />
      <LegalUpdated />
    </LegalDoc>
  );
}
