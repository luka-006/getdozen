"use client";

import { useRef, useState } from "react";
import { submitSupportMessage } from "@/actions/support";
import { Captcha } from "@/components/captcha";
import { DropdownPanel } from "@/components/dropdown-panel";

export function SupportButton({ email = "" }: { email?: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    setSent(false);
    setError(null);
  }

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
        onClose={close}
        ignoreCloseRefs={[triggerRef]}
        align="start"
        className="support-dropdown mt-2 w-[min(100vw-2rem,24rem)]"
      >
        <div className="surface p-4">
          {sent ? (
            <p className="text-[14px] text-ink/75">
              Message sent. We usually reply within one business day.
            </p>
          ) : (
            <form action={onSubmit} className="space-y-3">
              <p className="font-display text-[16px] font-semibold">
                Contact support
              </p>
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
                  rows={5}
                  className="field resize-y"
                  placeholder="What happened? Include steps if you can."
                />
              </label>
              <Captcha action="support" resetSignal={captchaNonce} />
              {error ? <p className="text-[13px] text-flag">{error}</p> : null}
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={pending}
              >
                {pending ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </DropdownPanel>
    </div>
  );
}
