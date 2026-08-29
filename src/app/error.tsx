"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ContactEmailLink } from "@/components/contact-email-link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink/45">
        Error
      </p>
      <h1 className="mt-3 font-display text-[32px] font-semibold">
        Something went wrong
      </h1>
      <p className="mt-3 text-[15px] text-ink/70">
        We hit an unexpected problem. Try again, or contact us if it keeps
        happening.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/board" className="btn btn-secondary">
          Board
        </Link>
      </div>
      <p className="mt-8 text-[13px] text-ink/55">
        Need help? <ContactEmailLink />
      </p>
    </div>
  );
}
