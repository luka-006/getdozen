"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signInWithEmailPassword } from "@/actions/auth";
import { Captcha } from "@/components/captcha";
import { GoogleIcon } from "@/components/icons";
import { LegalAgreementNotice } from "@/components/legal-doc";

export function LoginForm({
  next,
  initialError = null,
  initialMessage = null,
}: {
  next: string;
  initialError?: string | null;
  initialMessage?: string | null;
}) {
  const [error, setError] = useState<string | null>(initialError);
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [submitting, setSubmitting] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState<number | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);

  useEffect(() => {
    if (waitSeconds == null || waitSeconds <= 0) return;
    const t = window.setTimeout(() => {
      setWaitSeconds((s) => {
        if (s == null || s <= 1) {
          setError(null);
          return null;
        }
        const nextWait = s - 1;
        setError(`Wait ${nextWait} seconds, then try again.`);
        return nextWait;
      });
    }, 1000);
    return () => window.clearTimeout(t);
  }, [waitSeconds]);

  function applyWait(seconds: number | null | undefined, err: string) {
    if (seconds != null && seconds > 0) {
      setWaitSeconds(seconds);
      setError(`Wait ${seconds} seconds, then try again.`);
      return;
    }
    setWaitSeconds(null);
    setError(err);
  }

  async function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    if (waitSeconds != null && waitSeconds > 0) {
      setError(`Wait ${waitSeconds} seconds, then try again.`);
      return;
    }
    setSubmitting(true);
    const result = await signInWithEmailPassword(formData);
    setSubmitting(false);
    setCaptchaNonce((n) => n + 1);
    if (result && !result.ok) {
      applyWait(result.waitSeconds, result.error);
    }
  }

  const waiting = waitSeconds != null && waitSeconds > 0;

  return (
    <div className="auth-card surface p-6 sm:p-8">
      <div className="mb-6">
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-2 font-display text-[28px] font-semibold">Sign in</h1>
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

      <form action={onSubmit} className="space-y-4">
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
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={waiting || submitting}
        >
          {submitting ? "Signing in…" : waiting ? `Wait ${waitSeconds}s` : "Sign in"}
        </button>
        <LegalAgreementNotice action="signing in" />
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
