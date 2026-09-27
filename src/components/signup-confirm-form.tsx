"use client";

import Link from "next/link";
import { useState } from "react";
import { confirmSignupCode } from "@/actions/auth";
import { Captcha } from "@/components/captcha";
import { OtpDigitInputs } from "@/components/otp-digit-inputs";

type Phase = "code" | "confirming";

export function SignupConfirmForm({
  email,
  next,
  initialError = null,
}: {
  email: string;
  next: string;
  initialError?: string | null;
}) {
  const [phase, setPhase] = useState<Phase>("code");
  const [error, setError] = useState<string | null>(initialError);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [captchaNonce, setCaptchaNonce] = useState(0);

  async function onCode(token: string) {
    setError(null);
    setPhase("confirming");
    const formData = new FormData();
    formData.set("email", email);
    formData.set("token", token);
    formData.set("next", next);
    const result = await confirmSignupCode(formData);
    if (result && !result.ok) {
      setError(result.error);
      setPhase("code");
      setCaptchaNonce((n) => n + 1);
    }
  }

  function onDigitsChange(nextDigits: string[]) {
    setDigits(nextDigits);
    const token = nextDigits.join("");
    if (token.length === 6) void onCode(token);
  }

  return (
    <form
      className="auth-card surface space-y-5 p-6 sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        void onCode(digits.join(""));
      }}
    >
      <div>
        <p className="eyebrow">Confirm account</p>
        <p className="mt-2 font-display text-[26px] font-semibold leading-tight">
          Check your inbox
        </p>
        <p className="mt-2 text-[14px] text-ink/65">
          6-digit code sent to{" "}
          <span className="font-mono text-ink">{email}</span>
        </p>
      </div>

      <OtpDigitInputs
        digits={digits}
        onChange={onDigitsChange}
        disabled={phase !== "code"}
      />

      <Captcha action="signup" resetSignal={captchaNonce} />

      {error ? <p className="text-[13px] text-flag">{error}</p> : null}

      <p className="text-[13px] text-ink/50">
        {phase === "confirming"
          ? "Confirming…"
          : "Enter the code from your email, or tap Confirm email in the message."}
      </p>

      <p className="text-[13px] text-ink/55">
        Wrong email?{" "}
        <Link href="/signup" className="text-blue">
          Start over
        </Link>
      </p>
    </form>
  );
}
