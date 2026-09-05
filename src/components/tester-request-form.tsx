"use client";

import { useActionState, useEffect, useState } from "react";
import {
  emptyRequestFormState,
  type RequestFormState,
} from "@/lib/request-form";
import { BetaAccessLinkField } from "@/components/beta-access-link-field";
import { DotsTopUpLink } from "@/components/dots-topup-link";
import { PlatformField } from "@/components/platform-field";
import { PlatformDistributionHint } from "@/components/platform-distribution-hint";
import { ProductTypeField } from "@/components/product-type-field";
import { PriorityPicker } from "@/components/priority-picker";
import { StarIcon } from "@/components/icons";
import {
  MIN_TESTERS,
  TESTER_COST,
  TESTER_DURATION_OPTIONS,
  defaultPlatformForProductType,
  type Platform,
  type ProductType,
} from "@/lib/constants";
import { formatDots } from "@/lib/currency";
import { appUrlHint, appUrlPlaceholder } from "@/lib/platform-access";
import { randomDescriptionExample, TESTER_COUNT_OPTIONS } from "@/lib/placeholders";

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

export function TesterRequestForm({ balance, action }: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    emptyRequestFormState,
  );
  const [productType, setProductType] = useState<ProductType>("app");
  const [platform, setPlatform] = useState<Platform>(
    defaultPlatformForProductType("app"),
  );
  const [testersNeeded, setTestersNeeded] = useState<number>(MIN_TESTERS);
  const [descriptionPlaceholder, setDescriptionPlaceholder] = useState(
    "What it does",
  );

  useEffect(() => {
    setDescriptionPlaceholder(randomDescriptionExample(productType));
  }, [productType]);

  useEffect(() => {
    setPlatform(defaultPlatformForProductType(productType));
  }, [productType]);

  const baseCost = testersNeeded * TESTER_COST;
  const short = balance < baseCost;

  return (
    <form action={formAction} className="mt-8 space-y-4">
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
          placeholder={productType === "game" ? "Starlit Courier" : "MyApp"}
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
      <PlatformDistributionHint platform={platform} productType={productType} />
      {platform !== "web" && platform !== "itch" ? (
        <BetaAccessLinkField platform={platform} />
      ) : null}
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
              {n} testers · {formatDots(n * TESTER_COST)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="duration_days">
          Test length
          <RequiredMark />
        </label>
        <select
          id="duration_days"
          name="duration_days"
          className="select font-mono"
          defaultValue="14"
          required
        >
          {TESTER_DURATION_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} days
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
          placeholder={
            productType === "game"
              ? "First hour, controls, difficulty curve"
              : "Signup + paywall"
          }
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

      <PriorityPicker baseCost={baseCost} balance={balance} />

      {short ? (
        <p className="text-[13px] text-ink/65">
          You have {formatDots(balance)}. <DotsTopUpLink />
        </p>
      ) : null}

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
