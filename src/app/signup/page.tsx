import Link from "next/link";
import { signUpWithEmail } from "@/actions/auth";
import { Captcha } from "@/components/captcha";
import { GoogleIcon } from "@/components/icons";

type Props = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = params.next ?? "/board";

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-14">
      <div className="auth-card surface p-6 sm:p-8">
        <p className="eyebrow">Join Dozen</p>
        <h1 className="mt-2 font-display text-[28px] font-semibold">
          Create account
        </h1>
        <p className="mt-2 text-[14px] text-ink/70">
          Start posting feedback requests or earning as a tester.
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

        <form action={signUpWithEmail} className="mt-5 space-y-4">
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
          <Captcha action="signup" />
          <button type="submit" className="btn btn-primary w-full">
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-ink/70">
          Already have an account?{" "}
          <Link href="/login" className="text-blue">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
