import type { ReactNode } from "react";
import Link from "next/link";
import { LEGAL, LEGAL_PATHS, operatorOwnershipLine } from "@/lib/legal";

export function LegalDoc({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="atmosphere">
      <article className="mx-auto w-full max-w-[720px] px-4 py-12">
        <h1 className="font-display text-[32px] font-semibold">{title}</h1>
        <div className="legal-prose mt-8 space-y-6 text-[15px] leading-relaxed text-ink/85">
          {children}
        </div>
      </article>
    </div>
  );
}

export function LegalH({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-[20px] font-semibold text-ink">{children}</h2>
  );
}

export function LegalEmailLink() {
  return (
    <a className="text-blue" href={`mailto:${LEGAL.email}`}>
      {LEGAL.email}
    </a>
  );
}

export function LegalUpdated() {
  return (
    <p className="font-mono text-[12px] text-ink/45">
      Last updated {LEGAL.updated}
    </p>
  );
}

/** Single-line operator / ownership notice — Art. 6 + GDPR. */
export function LegalOperatorNotice({ className = "" }: { className?: string }) {
  const line = operatorOwnershipLine();
  if (!line) {
    return (
      <p className={`text-[13px] leading-relaxed text-ink/55 ${className}`}>
        Operator identity is published on the{" "}
        <Link className="text-blue" href={LEGAL_PATHS.notice}>
          legal notice
        </Link>{" "}
        before paid services go live.
      </p>
    );
  }
  return (
    <p className={`text-[13px] leading-relaxed text-ink/60 ${className}`}>
      {line}
    </p>
  );
}

/** Shown on signup, login, and waitlist — matches terms acceptance wording. */
export function LegalAgreementNotice({
  action = "using Dozen",
}: {
  action?: string;
}) {
  return (
    <p className="text-[12px] leading-relaxed text-ink/55">
      By {action}, you agree to our{" "}
      <Link className="text-blue" href={LEGAL_PATHS.terms}>
        Terms
      </Link>{" "}
      and{" "}
      <Link className="text-blue" href={LEGAL_PATHS.privacy}>
        Privacy policy
      </Link>
      .
    </p>
  );
}

export function LegalStackLinks() {
  return (
    <p className="text-[14px] text-ink/70">
      <Link className="text-blue" href={LEGAL_PATHS.terms}>
        Terms of use
      </Link>
      {" · "}
      <Link className="text-blue" href={LEGAL_PATHS.paymentTerms}>
        Payment terms
      </Link>
      {" · "}
      <Link className="text-blue" href={LEGAL_PATHS.privacy}>
        Privacy policy
      </Link>
      {" · "}
      <Link className="text-blue" href={LEGAL_PATHS.cookies}>
        Cookie notice
      </Link>
    </p>
  );
}
