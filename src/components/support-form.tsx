"use client";

import { useState } from "react";
import { submitSupportMessage } from "@/actions/support";
import { Captcha } from "@/components/captcha";

export function SupportForm({
  email = "",
  compact = false,
}: {
  email?: string;
  compact?: boolean;
}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [captchaNonce, setCaptchaNonce] = useState(0);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    formData.set("page", window.location.pathname + window.location.search);
    const result = await submitSupportMessage(formData);
    setCaptchaNonce((n) => n + 1);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-[15px] text-ink/75">
        Message sent. We usually reply within one business day.
      </p>
    );
  }

  return (
    <form action={onSubmit} className="space-y-3">
      {!compact ? (
        <p className="text-[14px] text-ink/65">
          Send a message — no mail app needed. We read every note at this inbox.
        </p>
      ) : null}
      <label className="block space-y-1 text-[13px]">
        <span className="text-ink/60">Your email</span>
        <input
          name="email"
          type="email"
          required
          defaultValue={email}
          className="field"
          autoComplete="email"
        />
      </label>
      <label className="block space-y-1 text-[13px]">
        <span className="text-ink/60">Subject</span>
        <input
          name="subject"
          required
          minLength={4}
          maxLength={120}
          className="field"
          placeholder="Billing, account, tester help…"
        />
      </label>
      <label className="block space-y-1 text-[13px]">
        <span className="text-ink/60">Message</span>
        <textarea
          name="message"
          required
          minLength={12}
          maxLength={4000}
          rows={compact ? 4 : 6}
          className="field resize-y"
          placeholder="What happened? Include steps if you can."
        />
      </label>
      <Captcha action="support" resetSignal={captchaNonce} />
      {error ? <p className="text-[13px] text-flag">{error}</p> : null}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
