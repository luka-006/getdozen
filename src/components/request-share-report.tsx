"use client";

import { useRef, useState, useTransition } from "react";
import { submitPostReport } from "@/actions/post-report";
import { Captcha } from "@/components/captcha";
import { DropdownPanel } from "@/components/dropdown-panel";
import { FlagIcon, ShareIcon } from "@/components/icons";

type Props = {
  requestId: string;
  appName: string;
  shareUrl: string;
};

export function RequestShareReport({ requestId, appName, shareUrl }: Props) {
  const [reportOpen, setReportOpen] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const [pending, startTransition] = useTransition();
  const reportTriggerRef = useRef<HTMLButtonElement>(null);

  async function onShare() {
    setShareNote(null);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: appName, url: shareUrl });
        setShareNote("Shared");
        return;
      }
    } catch {
      // Fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareNote("Link copied");
    } catch {
      setShareNote(shareUrl);
    }
  }

  function onReport(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitPostReport(formData);
      setCaptchaNonce((n) => n + 1);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSent(true);
      setTimeout(() => {
        setReportOpen(false);
        setSent(false);
      }, 1200);
    });
  }

  return (
    <div className="relative flex shrink-0 items-center gap-1">
      <button
        type="button"
        className="icon-btn"
        aria-label="Share post"
        title="Share"
        onClick={() => void onShare()}
      >
        <ShareIcon className="h-4 w-4" />
      </button>
      <button
        ref={reportTriggerRef}
        type="button"
        className="icon-btn"
        aria-label="Report post"
        title="Report"
        aria-expanded={reportOpen}
        onClick={() => {
          setReportOpen((v) => !v);
          setError(null);
          setSent(false);
        }}
      >
        <FlagIcon className="h-4 w-4" />
      </button>

      {shareNote ? (
        <span className="absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded-[6px] border border-border bg-paper px-2 py-1 text-[11px] text-ink/70 shadow-sm">
          {shareNote}
        </span>
      ) : null}

      <DropdownPanel
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        ignoreCloseRefs={[reportTriggerRef]}
        align="end"
        className="request-action-dropdown mt-2 w-[min(100vw-2rem,18rem)]"
      >
        <form action={onReport} className="surface space-y-3 p-4">
          <input type="hidden" name="request_id" value={requestId} />
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink/45">
            Report post
          </p>
          {sent ? (
            <p className="text-[13px] text-ink/70">Thanks. We got it.</p>
          ) : (
            <>
              <div className="field">
                <label htmlFor="report_reason">Reason</label>
                <select id="report_reason" name="reason" className="input" required>
                  <option value="Spam">Spam</option>
                  <option value="Scam or phishing">Scam or phishing</option>
                  <option value="Inappropriate">Inappropriate</option>
                  <option value="Broken link">Broken link</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="report_details">Details</label>
                <textarea
                  id="report_details"
                  name="details"
                  className="input min-h-[88px]"
                  required
                  minLength={8}
                  maxLength={2000}
                  placeholder="What is wrong with this post?"
                />
              </div>
              <div className="field">
                <label htmlFor="report_email">Email (optional)</label>
                <input
                  id="report_email"
                  name="email"
                  type="email"
                  className="input"
                  autoComplete="email"
                />
              </div>
              <Captcha action="bug" resetSignal={captchaNonce} />
              {error ? <p className="text-[13px] text-flag">{error}</p> : null}
              <button
                type="submit"
                className="btn btn-secondary w-full"
                disabled={pending}
              >
                {pending ? "Sending…" : "Send report"}
              </button>
            </>
          )}
        </form>
      </DropdownPanel>
    </div>
  );
}
