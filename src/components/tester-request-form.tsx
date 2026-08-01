"use client";

import { useActionState, useEffect, useState } from "react";
import {
  emptyRequestFormState,
  type RequestFormState,
} from "@/lib/request-form";
import { PlatformField } from "@/components/platform-field";
import { StarIcon } from "@/components/icons";
import { TESTER_COST } from "@/lib/constants";
import { randomDescriptionExample, TESTER_COUNT_OPTIONS } from "@/lib/placeholders";

function RequiredMark() {
  return (
    <span className="ml-1 inline-flex text-flag" title="Required" aria-label="required">
      <StarIcon />
    </span>
  );
}

type Props = {
  action: (
    prev: RequestFormState,
    formData: FormData,
  ) => Promise<RequestFormState>;
};

export function TesterRequestForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    emptyRequestFormState,
  );
  const [testersNeeded, setTestersNeeded] = useState<number>(12);
  const [descriptionPlaceholder, setDescriptionPlaceholder] = useState(
    "What it does",
  );

  useEffect(() => {
    setDescriptionPlaceholder(randomDescriptionExample());
  }, []);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {state.error ? (
        <p className="rounded-[6px] border border-flag/30 bg-flag/5 px-3 py-2 text-[13px] text-flag">
          {state.error}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="app_name">
          App name
          <RequiredMark />
        </label>
        <input
          id="app_name"
          name="app_name"
          className="input"
          required
          placeholder="MyApp"
        />
      </div>
      <div className="field">
        <label htmlFor="app_url">
          App URL
          <RequiredMark />
        </label>
        <input
          id="app_url"
          name="app_url"
          type="url"
          className="input"
          required
          placeholder="https://…"
        />
      </div>
      <div className="field">
        <label htmlFor="app_description">
          Description
          <RequiredMark />
        </label>
        <textarea
          id="app_description"
          name="app_description"
          className="textarea"
          required
          minLength={20}
          placeholder={descriptionPlaceholder}
        />
      </div>
      <PlatformField defaultValue="android" />
      <div className="field">
        <label htmlFor="opt_in_link">
          Play Console opt-in link
          <RequiredMark />
        </label>
        <input
          id="opt_in_link"
          name="opt_in_link"
          type="url"
          className="input"
          required
          placeholder="Play Console link"
        />
      </div>
      <div className="field">
        <label htmlFor="testers_needed">
          Testers needed
          <RequiredMark />
        </label>
        <select
          id="testers_needed"
          name="testers_needed"
          className="select font-mono"
          value={testersNeeded}
          onChange={(e) => setTestersNeeded(Number(e.target.value))}
          required
        >
          {TESTER_COUNT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} testers · {n * TESTER_COST} credits
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="test_focus">
          What to focus on
          <RequiredMark />
        </label>
        <textarea
          id="test_focus"
          name="test_focus"
          className="textarea"
          required
          minLength={10}
          placeholder="Signup + paywall"
        />
      </div>
      <div className="field">
        <label htmlFor="test_start_date">
          Start date
          <RequiredMark />
        </label>
        <input
          id="test_start_date"
          name="test_start_date"
          type="date"
          className="input font-mono"
          required
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full sm:w-auto"
        disabled={pending}
      >
        {pending ? "Posting…" : "Post request"}
      </button>
    </form>
  );
}
