import Link from "next/link";
import { signUpWithEmail } from "@/actions/auth";

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
      <div className="surface p-6 sm:p-8">
        <p className="font-display text-[18px] font-semibold tracking-[0.03em]">
          Dozen
        </p>
        <h1 className="mt-3 font-display text-[28px] font-semibold">
          Create account
        </h1>
        <p className="mt-2 text-[14px] text-ink/70">
          Early cohort — invite code if you have one.
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

        <form action={signUpWithEmail} className="mt-8 space-y-4">
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
          <button type="submit" className="btn btn-primary w-full">
            Create account
          </button>
        </form>

        <a
          href={`/auth/google?next=${encodeURIComponent(next)}`}
          className="btn btn-secondary mt-3 w-full"
        >
          Continue with Google
        </a>

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
