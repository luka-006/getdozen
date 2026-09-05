"use client";

import { useActionState, useEffect, useState } from "react";
import { purchaseDotsAmount } from "@/actions/billing";
import { DotsTopUpLink } from "@/components/dots-topup-link";
import { QuestionBuilder } from "@/components/question-builder";
import { PriorityPicker } from "@/components/priority-picker";
import { ProductTypeField } from "@/components/product-type-field";
import { StarIcon } from "@/components/icons";
import { PlatformField } from "@/components/platform-field";
import {
  FOCUS_TAGS,
  defaultPlatformForProductType,
  type Platform,
  type ProductType,
} from "@/lib/constants";
import { appUrlHint, appUrlPlaceholder } from "@/lib/platform-access";
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
  const [productType, setProductType] = useState<ProductType>("app");
  const [platform, setPlatform] = useState<Platform>(
    defaultPlatformForProductType("app"),
  );
  const [descriptionPlaceholder, setDescriptionPlaceholder] = useState(
    "What it does",
  );

  useEffect(() => {
    setDescriptionPlaceholder(randomDescriptionExample(productType));
  }, [productType]);

  useEffect(() => {
    setPlatform(defaultPlatformForProductType(productType));
  }, [productType]);

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
          <div className="space-y-2 rounded-[6px] border border-flag/30 bg-flag/5 px-3 py-2 text-[13px] text-flag">
            <p>{state.error}</p>
            <DotsTopUpLink />
          </div>
        ) : null}

        <ProductTypeField value={productType} onProductTypeChange={setProductType} />
        <div className="field">
          <label htmlFor="app_name">
            {productType === "game" ? "Game name" : "App name"}
            <RequiredMark />
          </label>
          <input
            id="app_name"
            name="app_name"
            className="input"
            required
            placeholder={productType === "game" ? "Vaultbreaker 2084" : "MyApp"}
          />
        </div>
        <div className="field">
          <label htmlFor="app_url">
            {productType === "game" ? "Store or page URL" : "App URL"}
            <RequiredMark />
          </label>
          <input
            id="app_url"
            name="app_url"
            type="url"
            className="input"
            required
            placeholder={appUrlPlaceholder(platform)}
          />
          {appUrlHint(platform) ? (
            <p className="text-[12px] text-ink/55">{appUrlHint(platform)}</p>
          ) : null}
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
        <PlatformField
          productType={productType}
          defaultValue={platform}
          onPlatformChange={setPlatform}
        />
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
            placeholder="demo@preview.example / temp-password"
          />
          <p className="text-[12px] text-ink/55">
            A fake account so reviewers can try it. Never share a real login.
          </p>
        </div>

        <QuestionBuilder balance={balance} />

        <PriorityPicker baseCost={10} balance={balance} />

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
