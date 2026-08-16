import Link from "next/link";
import { LEGAL } from "@/lib/legal";

const LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
  { href: "/legal", label: "Legal" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-paper">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5">
        <p className="font-mono text-[12px] text-ink/50">
          {LEGAL.brand} · {LEGAL.country}
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
