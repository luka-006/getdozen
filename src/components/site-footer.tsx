import Link from "next/link";
import { LEGAL, LEGAL_PATHS } from "@/lib/legal";

const LINKS = [
  { href: "/blog", label: "Blog" },
  { href: LEGAL_PATHS.privacy, label: "Privacy" },
  { href: LEGAL_PATHS.terms, label: "Terms" },
  { href: LEGAL_PATHS.paymentTerms, label: "Payment" },
  { href: LEGAL_PATHS.cookies, label: "Cookies" },
  { href: LEGAL_PATHS.notice, label: "Legal" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-paper">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5">
        <p className="font-mono text-[12px] text-ink/50">
          © {new Date().getFullYear()} {LEGAL.brand}. All rights reserved.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] text-ink/65 hover:text-blue"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
