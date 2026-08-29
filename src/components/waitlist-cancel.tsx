"use client";

import { useState } from "react";
import { cancelWaitlistEnrollment } from "@/actions/waitlist";
import { Captcha } from "@/components/captcha";

export function WaitlistCancel({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);

  async function onCancel(formData: FormData) {
    setBusy(true);
    setError(null);
    formData.set("email", email);
    const result = await cancelWaitlistEnrollment(formData);
    setCaptchaNonce((n) => n + 1);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="mt-6 border-t border-border/70 pt-4 text-[13px] text-ink/60">
        Your waitlist spot was removed. You can join again anytime before launch.
      </p>
    );
  }

  return (
    <form action={onCancel} className="mt-6 border-t border-border/70 pt-4">
      <input type="hidden" name="email" value={email} />
      <Captcha action="waitlist" resetSignal={captchaNonce} />
      {error ? (
        <p className="mt-2 text-[12px] text-flag">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-3 text-[12px] text-ink/45 underline-offset-2 transition-colors hover:text-ink/70 hover:underline disabled:opacity-50"
      >
        {busy ? "Removing…" : "Changed your mind? Cancel your waitlist spot"}
      </button>
    </form>
  );
}
