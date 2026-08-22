import Link from "next/link";
import { redirect } from "next/navigation";
import { signInWithEmail } from "@/actions/auth";
import { Captcha } from "@/components/captcha";
import { GoogleIcon } from "@/components/icons";

type Props = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    mode?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  if (params.mode === "signup") redirect("/signup");
  const next = params.next ?? "/board";

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-14">
      <div className="surface p-6 sm:p-8">
        <p className="font-display text-[18px] font-semibold tracking-[0.03em]">
          Dozen
        </p>
        <h1 className="mt-3 font-display text-[28px] font-semibold">Sign in</h1>
        <p className="mt-2 text-[14px] text-ink/70">
          Google, or email and password. Sign-in does not send an email.
        </p>

        {params.error ? (
          <p className="mt-4 rounded-[6px] border border-flag/40 bg-flag/5 px-3 py-2 text-[13px] text-flag">
            {params.error}
          </p>
        ) : null}
        {params.message ? (
          <p className="mt-4 rounded-[6px] border border-border bg-mist px-3 py-2 text-[13px]">
            {params.message}
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

        <form action={signInWithEmail} className="mt-5 space-y-4">
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
          <Captcha action="login" />
          <button type="submit" className="btn btn-primary w-full">
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-ink/70">
          New here?{" "}
          <Link href="/signup" className="text-blue">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
