import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink/45">
        404
      </p>
      <h1 className="mt-3 font-display text-[32px] font-semibold">Not found</h1>
      <p className="mt-3 text-[15px] text-ink/70">
        That page does not exist or was removed.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/board" className="btn btn-primary">
          Go to board
        </Link>
        <Link href="/" className="btn btn-secondary">
          Home
        </Link>
      </div>
      <p className="mt-8 text-[13px] text-ink/55">
        Need help?{" "}
        <a href={`mailto:${LEGAL.email}`} className="text-blue">
          {LEGAL.email}
        </a>
      </p>
    </div>
  );
}
