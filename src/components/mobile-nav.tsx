"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownPanel } from "@/components/dropdown-panel";

type NavLink = { href: string; label: string };

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  return (
    <div className="relative sm:hidden">
      <button
        ref={triggerRef}
        type="button"
        className="nav-burger"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>
      <DropdownPanel
        open={open}
        onClose={() => setOpen(false)}
        ignoreCloseRefs={[triggerRef]}
        align="end"
        className="mobile-nav-dropdown"
      >
        <nav id="mobile-nav" className="mobile-nav-panel">
          <ul className="flex flex-col gap-0.5">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(`${link.href}/`));
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`mobile-nav-link ${active ? "mobile-nav-link-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </DropdownPanel>
    </div>
  );
}
