import Link from "next/link";
import { requestPasswordReset } from "@/actions/auth";
import { Captcha } from "@/components/captcha";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-14">
      <div className="surface p-6 sm:p-8">
        <p className="font-display text-[18px] font-semibold tracking-[0.03em]">
          Dozen
        </p>
        <h1 className="mt-3 font-display text-[28px] font-semibold">
          Reset password
        </h1>
        <p className="mt-2 text-[14px] text-ink/70">
          We&apos;ll email you a reset link.
        </p>

        {params.error ? (
          <p className="mt-4 rounded-[6px] border border-flag/40 bg-flag/5 px-3 py-2 text-[13px] text-flag">
            {params.error}
          </p>
        ) : null}

        <form action={requestPasswordReset} className="mt-8 space-y-4">
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
          <Captcha action="reset" />
          <button type="submit" className="btn btn-primary w-full">
            Send reset link
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-ink/70">
          <Link href="/login" className="text-blue">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
