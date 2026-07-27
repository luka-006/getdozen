import Link from "next/link";
import { CreditBadge } from "@/components/credit-badge";
import type { Profile } from "@/lib/types";

const links = [
  { href: "/board", label: "Board" },
  { href: "/requests/new", label: "Post request" },
  { href: "/testers", label: "Testers" },
  { href: "/wallet", label: "Wallet" },
];

export function SiteHeader({ profile }: { profile: Profile | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link
            href={profile ? "/board" : "/"}
            className="font-display text-[18px] font-semibold tracking-[0.03em] text-ink"
          >
            getdozen.app
          </Link>
          {profile ? (
            <nav className="hidden items-center gap-4 sm:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] text-ink/80 hover:text-blue"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <CreditBadge
                value={profile.credits}
                pending={profile.credits_pending}
              />
              <Link
                href={`/profile/${profile.id}`}
                className="text-[13px] text-ink/80 hover:text-blue"
              >
                {profile.display_name}
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn btn-secondary min-h-9 px-3 text-[13px]">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary min-h-9 px-3 text-[13px]">
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
