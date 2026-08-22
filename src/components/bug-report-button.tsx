"use client";

import { useState } from "react";
import { submitBugReport } from "@/actions/bug-report";
import { Captcha } from "@/components/captcha";
import { BugIcon } from "@/components/icons";

export function BugReportButton({ email = "" }: { email?: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [captchaNonce, setCaptchaNonce] = useState(0);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    formData.set("page", window.location.pathname + window.location.search);
    const result = await submitBugReport(formData);
    setCaptchaNonce((n) => n + 1);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if ("mail" in result && result.mail) {
      try {
        await fetch(result.mail.url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(result.mail.body),
        });
      } catch {
        // Report is already saved; email is best-effort.
      }
    }
    setSent(true);
  }

  return (
    <div className="bug-report">
      {open ? (
        <div className="surface bug-report-panel p-4">
          {sent ? (
            <div className="space-y-3">
              <p className="font-display text-[16px] font-semibold">Sent</p>
              <p className="text-[13px] text-ink/70">
                Thanks. We will look at it.
              </p>
              <button
                type="button"
                className="btn btn-secondary w-full min-h-9 text-[13px]"
                onClick={() => {
                  setOpen(false);
                  setSent(false);
                  setError(null);
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <form action={onSubmit} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-[16px] font-semibold">
                  Report a bug
                </p>
                <button
                  type="button"
                  className="text-[12px] text-ink/55 hover:text-ink"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
              {error ? (
                <p className="rounded-[6px] border border-flag/40 bg-flag/5 px-3 py-2 text-[12px] text-flag">
                  {error}
                </p>
              ) : null}
              <div className="field">
                <label htmlFor="bug-summary">What broke</label>
                <input
                  id="bug-summary"
                  name="summary"
                  className="input"
                  required
                  minLength={8}
                  maxLength={160}
                  placeholder="Short description"
                />
              </div>
              <div className="field">
                <label htmlFor="bug-details">Details</label>
                <textarea
                  id="bug-details"
                  name="details"
                  className="textarea"
                  required
                  minLength={12}
                  maxLength={4000}
                  placeholder="What you did, what you expected, what happened."
                />
              </div>
              <div className="field">
                <label htmlFor="bug-email">Email (optional)</label>
                <input
                  id="bug-email"
                  name="email"
                  type="email"
                  className="input"
                  defaultValue={email}
                  autoComplete="email"
                />
              </div>
              <Captcha action="bug" resetSignal={captchaNonce} />
              <button
                type="submit"
                className="btn btn-primary w-full min-h-9 text-[13px]"
                disabled={pending}
              >
                {pending ? "Sending…" : "Send"}
              </button>
            </form>
          )}
        </div>
      ) : null}
      <button
        type="button"
        className="bug-report-btn"
        aria-expanded={open}
        aria-label="Report a bug"
        onClick={() => {
          setOpen((value) => !value);
          setSent(false);
          setError(null);
        }}
      >
        <BugIcon className="h-4 w-4" />
        Bug
      </button>
    </div>
  );
}
