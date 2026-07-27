import Link from "next/link";
import { addShippedApp } from "@/actions/shipped";
import { requireProfile } from "@/lib/auth";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewShippedAppPage({ searchParams }: Props) {
  await requireProfile();
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <p className="text-[13px] text-ink/55">
        <Link href="/wall" className="text-blue">
          Wall
        </Link>{" "}
        / add
      </p>
      <h1 className="mt-2 font-display text-[32px] font-semibold">Add shipped app</h1>
      <p className="mt-1 text-ink/70">
        Credit the reviewers and testers who helped you ship.
      </p>

      {params.error ? (
        <p className="mt-4 text-[13px] text-flag">{params.error}</p>
      ) : null}

      <form action={addShippedApp} className="mt-8 space-y-4">
        <div className="field">
          <label htmlFor="app_name">App name</label>
          <input id="app_name" name="app_name" className="input" required maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="app_url">App URL</label>
          <input id="app_url" name="app_url" type="url" className="input" required />
        </div>
        <div className="field">
          <label htmlFor="launched_at">Launch date</label>
          <input
            id="launched_at"
            name="launched_at"
            type="date"
            className="input font-mono"
            defaultValue={today}
          />
        </div>
        <div className="field">
          <label htmlFor="helper_emails">Helper emails (optional)</label>
          <textarea
            id="helper_emails"
            name="helper_emails"
            className="textarea"
            placeholder="Comma-separated emails of getdozen.app profiles who helped"
          />
          <p className="text-[12px] text-ink/55">
            Must match accounts already on getdozen.app.
          </p>
        </div>
        <button type="submit" className="btn btn-primary">
          Publish to wall
        </button>
      </form>
    </div>
  );
}
