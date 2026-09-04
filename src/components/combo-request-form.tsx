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
import { QuestionBuilder } from "@/components/question-builder";
import { StarIcon } from "@/components/icons";
import {
  COMBO_PACKS,
  TESTER_DURATION_OPTIONS,
  defaultPlatformForProductType,
  type ComboPackId,
  type Platform,
  type ProductType,
} from "@/lib/constants";
import { formatDots } from "@/lib/currency";
import { appUrlHint, appUrlPlaceholder } from "@/lib/platform-access";
import { randomDescriptionExample } from "@/lib/placeholders";

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

export function ComboRequestForm({ balance, action }: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    emptyRequestFormState,
  );
  const [productType, setProductType] = useState<ProductType>("app");
  const [platform, setPlatform] = useState<Platform>(
    defaultPlatformForProductType("app"),
  );
  const [packId, setPackId] = useState<ComboPackId>("combo_12_10");
  const pack = COMBO_PACKS.find((p) => p.id === packId)!;
  const [descriptionPlaceholder, setDescriptionPlaceholder] = useState(
    "What it does",
  );

  useEffect(() => {
    setDescriptionPlaceholder(randomDescriptionExample());
  }, []);

  useEffect(() => {
    setPlatform(defaultPlatformForProductType(productType));
  }, [productType]);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {state.error ? (
        <div className="space-y-2 rounded-[6px] border border-flag/30 bg-flag/5 px-3 py-2 text-[13px] text-flag">
          <p>{state.error}</p>
          <DotsTopUpLink />
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="combo_pack">Pack</label>
        <select
          id="combo_pack"
          name="combo_pack"
          className="select"
          value={packId}
          onChange={(e) => setPackId(e.target.value as ComboPackId)}
          required
        >
          {COMBO_PACKS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} · {formatDots(p.credits)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[13px] text-ink/60">
          Cheaper than testers + feedback bought separately. A bigger pack
          costs more.
        </p>
      </div>

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
          placeholder={productType === "game" ? "Pinefolk Tavern" : "MyApp"}
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
              ? "Tutorial pacing, combat feel, performance"
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

      <QuestionBuilder
        key={pack.id}
        balance={balance}
        targetTotal={pack.questions}
        showCost={false}
      />

      <p className="font-mono text-[14px]">
        {formatDots(pack.credits)} · {pack.testers} testers · {pack.questions} questions
        {balance < pack.credits ? (
          <span className="text-flag"> · you have {formatDots(balance)}</span>
        ) : null}
      </p>
      {balance < pack.credits ? (
        <p className="text-[13px]">
          <DotsTopUpLink />
        </p>
      ) : null}

      <PriorityPicker baseCost={pack.credits} balance={balance} />

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
