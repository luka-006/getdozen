"use client";

import { useActionState, useEffect, useState } from "react";
import { purchaseDotsAmount } from "@/actions/billing";
import { QuestionBuilder } from "@/components/question-builder";
import { PriorityPicker } from "@/components/priority-picker";
import { StarIcon } from "@/components/icons";
import { PlatformField } from "@/components/platform-field";
import { FOCUS_TAGS } from "@/lib/constants";
import { randomDescriptionExample } from "@/lib/placeholders";
import {
  emptyRequestFormState,
  type RequestFormState,
} from "@/lib/request-form";

function RequiredMark() {
  return (
    <span className="ml-1 inline-flex text-flag" title="Required" aria-label="required">
      <StarIcon />
    </span>
  );
}

type Props = {
  balance: number;
  action: (
    prev: RequestFormState,
    formData: FormData,
  ) => Promise<RequestFormState>;
};

export function FeedbackRequestForm({ balance, action }: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    emptyRequestFormState,
  );
  const [descriptionPlaceholder, setDescriptionPlaceholder] = useState(
    "What it does",
  );

  useEffect(() => {
    setDescriptionPlaceholder(randomDescriptionExample());
  }, []);

  return (
    <>
      <form
        id="buy-dots-exact"
        action={purchaseDotsAmount}
        className="hidden"
      >
        <input type="hidden" name="return_to" value="/requests/new?type=feedback" />
      </form>

      <form action={formAction} className="mt-8 space-y-6">
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
        <PlatformField />
        <div className="field">
          <label htmlFor="focus_tag">Focus</label>
          <select
            id="focus_tag"
            name="focus_tag"
            className="select"
            defaultValue="Everything"
          >
            {FOCUS_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="test_credentials">
            Throwaway login for reviewers (optional)
          </label>
          <textarea
            id="test_credentials"
            name="test_credentials"
            className="textarea"
            placeholder="demo@app.com / temp-password"
          />
          <p className="text-[12px] text-ink/55">
            A fake account so reviewers can open the app. Never share a real login.
          </p>
        </div>

        <QuestionBuilder balance={balance} />

        <PriorityPicker baseCost={10} />

        <button
          type="submit"
          className="btn btn-primary w-full sm:w-auto"
          disabled={pending}
        >
          {pending ? "Posting…" : "Post request"}
        </button>
      </form>
    </>
  );
}
