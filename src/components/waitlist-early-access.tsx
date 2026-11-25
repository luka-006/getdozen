"use client";

import { useState } from "react";
import { requestWaitlistEarlyAccess } from "@/actions/waitlist";

export function WaitlistEarlyAccess({ initialDone = false }: { initialDone?: boolean }) {
  const [phase, setPhase] = useState<"idle" | "saving" | "done" | "error">(
    initialDone ? "done" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (phase === "saving" || phase === "done") return;
    setPhase("saving");
    setError(null);
    const result = await requestWaitlistEarlyAccess();
    if (!result.ok) {
      setError(result.error);
      setPhase("error");
      return;
    }
    setPhase("done");
  }

  if (phase === "done") {
    return (
      <p className="text-[15px] text-ink/80">
        Got it, we&apos;ll invite early testers in batches.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => void onClick()}
        disabled={phase === "saving"}
        aria-busy={phase === "saving"}
      >
        I want early access
      </button>
      {error ? <p className="text-[13px] text-flag">{error}</p> : null}
    </div>
  );
}
