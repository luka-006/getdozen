"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  confirmLoginCode,
  requestLoginCode,
  resendLoginCode,
} from "@/actions/auth";
import { Captcha } from "@/components/captcha";
import { GoogleIcon } from "@/components/icons";

type Phase = "credentials" | "sending" | "code" | "confirming";

export function LoginForm({
  next,
  initialError = null,
  initialMessage = null,
}: {
  next: string;
  initialError?: string | null;
  initialMessage?: string | null;
}) {
  const [phase, setPhase] = useState<Phase>("credentials");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  async function onCredentials(formData: FormData) {
    setError(null);
    setMessage(null);
    setPhase("sending");
    const result = await requestLoginCode(formData);
    setCaptchaNonce((n) => n + 1);
    if (!result.ok) {
      setError(result.error);
      setPhase("credentials");
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
    formData.set("next", next);
    const result = await confirmLoginCode(formData);
    if (result && !result.ok) {
      setError(result.error);
      setPhase("code");
      setCaptchaNonce((n) => n + 1);
    }
  }

  async function onResend(form: HTMLFormElement | null) {
    setError(null);
    const formData = form ? new FormData(form) : new FormData();
    formData.set("email", email);
    setPhase("sending");
    const result = await resendLoginCode(formData);
    setCaptchaNonce((n) => n + 1);
    if (!result.ok) {
      setError(result.error);
      setPhase("code");
      return;
    }
    setDigits(["", "", "", "", "", ""]);
    setPhase("code");
    setMessage("New code sent.");
  }

  function setDigit(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    setDigits(nextDigits);
    if (char && index < 5) inputs.current[index + 1]?.focus();
    const token = nextDigits.join("");
    if (token.length === 6) void onCode(token);
  }

  if (phase === "code" || phase === "confirming" || phase === "sending") {
    return (
      <form
        className="auth-card surface space-y-5 p-6 sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          void onCode(digits.join(""));
        }}
      >
        <div>
          <p className="eyebrow">Confirm sign-in</p>
          <p className="mt-2 font-display text-[26px] font-semibold leading-tight">
            Check your inbox
          </p>
          <p className="mt-2 text-[14px] text-ink/65">
            6-digit code sent to{" "}
            <span className="font-mono text-ink">{email}</span>
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
              disabled={phase !== "code"}
              onChange={(event) => setDigit(i, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !digits[i] && i > 0) {
                  inputs.current[i - 1]?.focus();
                }
              }}
              className="otp-digit"
            />
          ))}
        </div>

        <Captcha action="login" resetSignal={captchaNonce} />

        {error ? <p className="text-[13px] text-flag">{error}</p> : null}
        {message ? (
          <p className="text-[13px] text-ink/70">{message}</p>
        ) : null}

        <p className="text-[13px] text-ink/50">
          {phase === "confirming"
            ? "Confirming…"
            : phase === "sending"
              ? "Sending code…"
              : "Enter the code from your email."}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="text-[13px] text-blue"
            disabled={phase !== "code"}
            onClick={(event) => {
              void onResend(event.currentTarget.form);
            }}
          >
            Send a new code
          </button>
          <button
            type="button"
            className="text-[13px] text-ink/55 hover:text-ink"
            disabled={phase === "confirming"}
            onClick={() => {
              setPhase("credentials");
              setError(null);
              setMessage(null);
              setCaptchaNonce((n) => n + 1);
            }}
          >
            Use a different account
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="auth-card surface p-6 sm:p-8">
      <div className="mb-6">
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-2 font-display text-[28px] font-semibold">Sign in</h1>
        <p className="mt-2 text-[14px] text-ink/70">
          Google, or email and password — we email a 6-digit code to confirm.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-[var(--radius-app)] border border-flag/40 bg-flag/5 px-3 py-2 text-[13px] text-flag">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-[var(--radius-app)] border border-border bg-mist px-3 py-2 text-[13px]">
          {message}
        </p>
      ) : null}

      <a
        href={`/auth/google?next=${encodeURIComponent(next)}`}
        className="btn btn-secondary relative z-10 w-full"
      >
        <GoogleIcon />
        Continue with Google
      </a>

      <div className="my-5 flex items-center gap-3 text-[12px] text-ink/45">
        <span className="h-px flex-1 bg-border" />
        or email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={onCredentials} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            required
            autoComplete="email"
            defaultValue={email}
          />
        </div>
        <div className="field">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="password">Password</label>
            <Link
              href="/login/forgot"
              className="text-[12px] text-ink/55 hover:text-blue"
            >
              Forgot?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            required
            minLength={8}
            autoComplete="current-password"
          />
        </div>
        <Captcha action="login" resetSignal={captchaNonce} />
        <button type="submit" className="btn btn-primary w-full">
          Continue
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink/70">
        New here?{" "}
        <Link href="/signup" className="text-blue">
          Create account
        </Link>
      </p>
    </div>
  );
}
