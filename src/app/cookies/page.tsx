import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalH } from "@/components/legal-doc";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cookies · Dozen",
  description: "Cookie use on getdozen.dev.",
};

export default function CookiesPage() {
  return (
    <LegalDoc title="Cookie notice">
      <p>
        Croatian electronic-communications law (transposing the ePrivacy
        Directive) and the GDPR apply. Consent is required before any
        non-essential cookie is stored. Dozen currently sets{" "}
        <strong>only strictly necessary cookies</strong>. There is no
        analytics, advertising, or social-pixel cookie, so we do not show a
        consent banner.
      </p>

      <LegalH>What we set</LegalH>
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
          cookie used only on account and waitlist forms to stop bots. It is
          not used for advertising.
        </li>
      </ul>
      <p>
        These fall under the “strictly necessary” exception. Legal basis for
        related personal data is contract or the steps you ask us to take
        (GDPR Art. 6(1)(b)), or our interest in running a secure site (Art.
        6(1)(f)).
      </p>

      <LegalH>What we do not set</LegalH>
      <p>
        No Google Analytics, Meta pixel, advertising IDs, or optional
        preference cookies. If that changes, we will add a consent choice
        before any optional cookie is stored, and we will update this notice.
      </p>

      <LegalH>How to delete them</LegalH>
      <p>
        Use your browser settings to clear cookies for getdozen.dev. That
        signs you out. More on personal data:{" "}
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
