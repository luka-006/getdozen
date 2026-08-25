"use client";

import { verifyAdminGate } from "@/actions/admin-console";

export function AdminGateForm({ configured }: { configured: boolean }) {
  return (
    <form action={verifyAdminGate} className="surface mx-auto mt-10 max-w-sm space-y-4 p-6">
      <p className="font-display text-[20px] font-semibold">Authenticator</p>
      <p className="text-[13px] text-ink/65">
        Enter the 6-digit code from your authenticator app.
      </p>
      {!configured ? (
        <p className="rounded-[6px] border border-flag/30 bg-flag/5 px-3 py-2 text-[13px] text-flag">
          Console secrets are not set on this server.
        </p>
      ) : null}
      <div className="field">
        <label htmlFor="admin-code">Code</label>
        <input
          id="admin-code"
          name="code"
          className="input font-mono text-center text-[20px] tracking-[0.3em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          disabled={!configured}
          autoFocus
        />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={!configured}>
        Unlock
      </button>
    </form>
  );
}
