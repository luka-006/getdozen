import { createFeedbackRequest, createTesterRequest } from "@/actions/requests";
import { QuestionBuilder } from "@/components/question-builder";
import { requireProfile } from "@/lib/auth";
import { FOCUS_TAGS } from "@/lib/constants";
import { formatCredits } from "@/lib/utils";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ type?: string; error?: string }>;
};

export default async function NewRequestPage({ searchParams }: Props) {
  const profile = await requireProfile();
  const params = await searchParams;
  const tester = params.type === "tester";

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <h1 className="font-display text-[32px] font-semibold">Post request</h1>
      <p className="mt-1 text-ink/70">
        Balance:{" "}
        <span className="rounded-[6px] bg-credit px-1.5 py-0.5 font-mono text-ink">
          {formatCredits(profile.credits)}
        </span>
      </p>

      <div className="mt-6 flex gap-2">
        <Link
          href="/requests/new"
          className={`btn ${!tester ? "btn-primary" : "btn-secondary"}`}
        >
          Feedback
        </Link>
        <Link
          href="/requests/new?type=tester"
          className={`btn ${tester ? "btn-primary" : "btn-secondary"}`}
        >
          Testers
        </Link>
      </div>

      {params.error ? (
        <p className="mt-4 text-[13px] text-flag">{params.error}</p>
      ) : null}

      {tester ? (
        <form action={createTesterRequest} className="mt-8 space-y-4">
          <div className="field">
            <label htmlFor="app_name">App name</label>
            <input id="app_name" name="app_name" className="input" required />
          </div>
          <div className="field">
            <label htmlFor="app_url">App URL</label>
            <input id="app_url" name="app_url" type="url" className="input" required />
          </div>
          <div className="field">
            <label htmlFor="app_description">Description</label>
            <textarea
              id="app_description"
              name="app_description"
              className="textarea"
              required
              minLength={20}
            />
          </div>
          <div className="field">
            <label htmlFor="opt_in_link">Play Console opt-in link</label>
            <input
              id="opt_in_link"
              name="opt_in_link"
              type="url"
              className="input"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="testers_needed">Testers needed</label>
            <input
              id="testers_needed"
              name="testers_needed"
              type="number"
              className="input font-mono"
              defaultValue={12}
              min={1}
              max={100}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="test_focus">What testers should focus on</label>
            <textarea
              id="test_focus"
              name="test_focus"
              className="textarea"
              required
              minLength={10}
            />
          </div>
          <div className="field">
            <label htmlFor="test_start_date">Test start date</label>
            <input
              id="test_start_date"
              name="test_start_date"
              type="date"
              className="input font-mono"
              required
            />
          </div>
          <p className="text-[13px] text-ink/65">
            Each tester costs 2 credits. They earn 3 when they finish 14 days.
          </p>
          <button type="submit" className="btn btn-primary">
            Post request
          </button>
        </form>
      ) : (
        <form action={createFeedbackRequest} className="mt-8 space-y-6">
          <div className="field">
            <label htmlFor="app_name">App name</label>
            <input id="app_name" name="app_name" className="input" required />
          </div>
          <div className="field">
            <label htmlFor="app_url">App URL</label>
            <input id="app_url" name="app_url" type="url" className="input" required />
          </div>
          <div className="field">
            <label htmlFor="app_description">Description</label>
            <textarea
              id="app_description"
              name="app_description"
              className="textarea"
              required
              minLength={20}
            />
          </div>
          <div className="field">
            <label htmlFor="focus_tag">Focus tag</label>
            <select id="focus_tag" name="focus_tag" className="select">
              <option value="">No tag</option>
              {FOCUS_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="test_credentials">Test login (optional)</label>
            <textarea
              id="test_credentials"
              name="test_credentials"
              className="textarea"
              placeholder="Create a throwaway test account. Do not share a real login."
            />
            <p className="text-[13px] text-ink/60">
              Encrypted at rest. Shown only to the assigned reviewer while the
              review is open.
            </p>
          </div>

          <QuestionBuilder />

          <button type="submit" className="btn btn-primary">
            Post request
          </button>
        </form>
      )}
    </div>
  );
}
