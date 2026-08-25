import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { CreditBadge } from "@/components/credit-badge";
import { DozenMark } from "@/components/dozen-mark";
import { MobileNav } from "@/components/mobile-nav";
import { NavLink } from "@/components/nav-link";
import type { Profile } from "@/lib/types";

export function SiteHeader({
  profile,
  waitlistLock,
}: {
  profile: Profile | null;
  waitlistLock?: boolean;
}) {
  if (waitlistLock && !profile?.is_admin) {
    return (
      <header className="sticky top-0 z-20 border-b border-border bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5 text-ink">
            <DozenMark className="h-8 w-8 shrink-0" />
            <span className="font-display text-[18px] font-semibold tracking-[0.03em]">
              Dozen
            </span>
          </Link>
          <Link href="/blog" className="text-[13px] text-ink/80 hover:text-blue">
            Blog
          </Link>
        </div>
      </header>
    );
  }

  const links = profile
    ? [
        { href: "/board", label: "Board" },
        { href: "/requests/new", label: "Post" },
        { href: "/testers", label: "My tests" },
        { href: "/blog", label: "Blog" },
        { href: "/wallet", label: "Wallet" },
        { href: `/profile/${profile.id}`, label: "Profile" },
      ]
    : [
        { href: "/pricing", label: "Pricing" },
        { href: "/blog", label: "Blog" },
        { href: "/wall", label: "Wall" },
      ];

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-paper/95 backdrop-blur-md">
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link
            href={profile ? "/board" : "/"}
            className="flex items-center gap-2.5 text-ink"
          >
            <DozenMark className="h-8 w-8 shrink-0" />
            <span className="font-display text-[18px] font-semibold tracking-[0.03em]">
              Dozen
            </span>
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <Link href="/wallet" className="shrink-0" title="Wallet">
                <CreditBadge
                  value={profile.credits}
                  pending={profile.credits_pending}
                />
              </Link>
              <Link
                href={`/profile/${profile.id}`}
                className="shrink-0"
                title="Profile"
              >
                <Avatar name={profile.display_name} url={profile.avatar_url} />
              </Link>
              <MobileNav links={links} />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn btn-secondary min-h-9 shrink-0 whitespace-nowrap px-3 text-[13px]">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary min-h-9 shrink-0 whitespace-nowrap px-3 text-[13px]">
                Join
              </Link>
              <MobileNav links={links} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
