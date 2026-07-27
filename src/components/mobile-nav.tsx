"use client";

import { useState } from "react";
import Link from "next/link";

type NavLink = { href: string; label: string };

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        className="btn btn-secondary min-h-9 px-3 text-[13px]"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Close" : "Menu"}
      </button>
      {open ? (
        <nav
          id="mobile-nav"
          className="absolute left-0 right-0 top-full border-b border-border bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md"
        >
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-[6px] px-2 py-2 text-[15px] text-ink/85 hover:bg-mist hover:text-blue"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
