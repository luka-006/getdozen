"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { DropdownPanel } from "@/components/dropdown-panel";
import { SupportForm } from "@/components/support-form";

export function SupportButton({ email = "" }: { email?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        className="text-[13px] text-ink/65 hover:text-blue"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Support
      </button>
      <DropdownPanel
        open={open}
        onClose={() => setOpen(false)}
        ignoreCloseRefs={[triggerRef]}
        align="start"
        className="support-dropdown mt-2 w-[min(100vw-2rem,24rem)]"
      >
        <div className="surface p-4">
          <p className="mb-3 font-display text-[16px] font-semibold">
            Contact support
          </p>
          <SupportForm email={email} compact />
          <p className="mt-3 text-[12px] text-ink/55">
            Or{" "}
            <Link href="/contact" className="text-blue" onClick={() => setOpen(false)}>
              open full contact page
            </Link>
            .
          </p>
        </div>
      </DropdownPanel>
    </div>
  );
}
