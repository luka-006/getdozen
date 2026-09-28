"use client";

import Link from "next/link";
import { useState } from "react";
import { signUpWithEmail } from "@/actions/auth";
import { Captcha } from "@/components/captcha";
import { GoogleIcon } from "@/components/icons";
import { LegalAgreementNotice } from "@/components/legal-doc";

export function SignupForm({
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
  const [captchaNonce, setCaptchaNonce] = useState(0);

  async function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    setSubmitting(true);
    const result = await signUpWithEmail(formData);
    setSubmitting(false);
    setCaptchaNonce((n) => n + 1);
    if (result && !result.ok) {
      setError(result.error);
    } else if (result?.ok) {
      setMessage(result.message);
    }
  }

  return (
    <div className="auth-card surface p-6 sm:p-8">
      <p className="eyebrow">Join Dozen</p>
      <h1 className="mt-2 font-display text-[28px] font-semibold">
        Create account
      </h1>
      <p className="mt-2 text-[14px] text-ink/70">
        Start posting feedback requests or earning as a tester. After you create
        an account, check your email and tap the confirmation link to sign in.
      </p>

      {error ? (
        <p className="mt-4 rounded-[6px] border border-flag/40 bg-flag/5 px-3 py-2 text-[13px] text-flag">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-[6px] border border-border bg-mist px-3 py-2 text-[13px]">
          {message}
        </p>
      ) : null}

      <a
        href={`/auth/google?next=${encodeURIComponent(next)}`}
        className="btn btn-secondary relative z-10 mt-8 w-full"
      >
        <GoogleIcon />
        Continue with Google
      </a>

      <div className="mt-5 flex items-center gap-3 text-[12px] text-ink/45">
        <span className="h-px flex-1 bg-border" />
        or email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={onSubmit} className="mt-5 space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="field">
          <label htmlFor="display_name">Display name</label>
          <input
            id="display_name"
            name="display_name"
            className="input"
            required
            autoComplete="name"
          />
        </div>
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
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="field">
          <label htmlFor="invite_code">Invite code</label>
          <input
            id="invite_code"
            name="invite_code"
            className="input"
            autoComplete="off"
            placeholder="Optional unless gated"
          />
        </div>
        <Captcha action="signup" resetSignal={captchaNonce} />
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={submitting}
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
        <LegalAgreementNotice action="creating an account" />
      </form>

      <p className="mt-6 text-center text-[13px] text-ink/70">
        Already have an account?{" "}
        <Link href="/login" className="text-blue">
          Sign in
        </Link>
      </p>
    </div>
  );
}
