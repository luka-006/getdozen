"use client";

import { useRef } from "react";

export function OtpDigitInputs({
  digits,
  onChange,
  disabled,
}: {
  digits: string[];
  onChange: (nextDigits: string[]) => void;
  disabled?: boolean;
}) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    onChange(nextDigits);
    if (char && index < 5) inputs.current[index + 1]?.focus();
  }

  return (
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
          disabled={disabled}
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
  );
}
