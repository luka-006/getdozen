"use client";

import { useRef, useState } from "react";
import { confirmWaitlistCode, requestWaitlistCode } from "@/actions/waitlist";
import { Captcha } from "@/components/captcha";
import { LegalAgreementNotice } from "@/components/legal-doc";
import { WaitlistJoined } from "@/components/waitlist-joined";

type Phase = "idle" | "sending" | "code" | "confirming" | "joined";

export function WaitlistForm({
  initialEmail = "",
  initialPhase = "idle",
  notice = null,
}: {
  initialEmail?: string;
  initialPhase?: Phase;
  notice?: string | null;
}) {
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(notice);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  async function onEmail(formData: FormData, stayOnCode = false) {
    setError(null);
    if (!stayOnCode) setPhase("sending");
    const result = await requestWaitlistCode(formData);
    setCaptchaNonce((n) => n + 1);
    if (!result.ok) {
      setError(result.error);
      setPhase(stayOnCode ? "code" : "idle");
      return;
    }
    setEmail(result.email);
    setDigits(["", "", "", "", "", ""]);
    setPhase("code");
  }

  async function onCode(token: string) {
    setError(null);
    setPhase("confirming");
    const formData = new FormData();
    formData.set("email", email);
    formData.set("token", token);
    const result = await confirmWaitlistCode(formData);
    if (!result.ok) {
      setError(result.error);
      setPhase("code");
      return;
    }
    setPhase("joined");
  }

  function setDigit(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < 5) inputs.current[index + 1]?.focus();
    const token = next.join("");
    if (token.length === 6) void onCode(token);
  }

  if (phase === "joined") {
    return <WaitlistJoined email={email} />;
  }

  if (phase === "code" || phase === "confirming") {
    return (
      <form
        className="waitlist-card surface space-y-5 p-6 sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          void onCode(digits.join(""));
        }}
      >
        <div>
          <p className="font-display text-[22px] font-semibold">Check your inbox</p>
          <p className="mt-1 text-[14px] text-ink/65">
            Code sent to <span className="font-mono text-ink">{email}</span>
          </p>
        </div>
        <div className="flex justify-between gap-2">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              disabled={phase === "confirming"}
              onChange={(event) => setDigit(i, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !digits[i] && i > 0) {
                  inputs.current[i - 1]?.focus();
                }
              }}
              className="h-12 w-10 rounded-[6px] border border-border bg-paper text-center font-mono text-[20px] sm:h-14 sm:w-12"
            />
          ))}
        </div>
        {error ? <p className="text-[13px] text-flag">{error}</p> : null}
        <Captcha action="waitlist" resetSignal={captchaNonce} />
        <p className="text-[13px] text-ink/50">
          {phase === "confirming"
            ? "Confirming…"
            : "Enter the 6-digit code from the email."}
        </p>
        <button
          type="button"
          className="text-[13px] text-blue"
          disabled={phase === "confirming"}
          onClick={(event) => {
            const form = event.currentTarget.form;
            const formData = form ? new FormData(form) : new FormData();
            formData.set("email", email);
            void onEmail(formData, true);
          }}
        >
          Send a new code
        </button>
      </form>
    );
  }

  return (
    <form action={onEmail} className="waitlist-card surface space-y-5 p-6 sm:p-8">
      <div>
        <p className="font-display text-[22px] font-semibold">Get in at launch</p>
        <p className="mt-1 text-[14px] text-ink/65">
          Enter your email. We will write at launch.
        </p>
      </div>
      <div className="field">
        <label htmlFor="waitlist-email">Email</label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@studio.dev"
          defaultValue={email}
          disabled={phase === "sending"}
        />
      </div>
      <Captcha action="waitlist" resetSignal={captchaNonce} />
      {error ? <p className="text-[13px] text-flag">{error}</p> : null}
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={phase === "sending"}
      >
        {phase === "sending" ? "Sending…" : "Join waitlist"}
      </button>
      <LegalAgreementNotice action="joining the waitlist" />
    </form>
  );
}
