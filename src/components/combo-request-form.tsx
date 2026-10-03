"use client";

import { useActionState, useEffect, useState } from "react";
import {
  emptyRequestFormState,
  type RequestFormState,
} from "@/lib/request-form";
import { BetaAccessLinkField } from "@/components/beta-access-link-field";
import { ChoiceTiles } from "@/components/choice-tiles";
import { DotsTopUpLink } from "@/components/dots-topup-link";
import { OneQuestionFlow, QuestionStep } from "@/components/one-question-flow";
import { PlatformField } from "@/components/platform-field";
import { PlatformDistributionHint } from "@/components/platform-distribution-hint";
import { PublishingTipsPanel } from "@/components/publishing-tips-panel";
import { ProductTypeField } from "@/components/product-type-field";
import { ProductImageField } from "@/components/product-image-field";
import { PriorityPicker } from "@/components/priority-picker";
import { QuestionBuilder } from "@/components/question-builder";
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
  const [durationDays, setDurationDays] = useState("14");
  const pack = COMBO_PACKS.find((item) => item.id === packId)!;
  const [descriptionPlaceholder, setDescriptionPlaceholder] = useState(
    "What it does",
  );

  useEffect(() => {
    setDescriptionPlaceholder(randomDescriptionExample(productType));
  }, [productType]);

  useEffect(() => {
    setPlatform(defaultPlatformForProductType(productType));
  }, [productType]);

  const needsAccess = platform !== "web" && platform !== "itch";
  const short = balance < pack.credits;

  const error = state.error ? (
    <div className="mb-4 space-y-2 rounded-[6px] border border-flag/30 bg-flag/5 px-3 py-2 text-[13px] text-flag">
      <p>{state.error}</p>
      <DotsTopUpLink />
    </div>
  ) : null;

  return (
    <form action={formAction} encType="multipart/form-data" className="mt-6 md:mt-8">
      <OneQuestionFlow pending={pending} error={error}>
        <QuestionStep
          question="Which pack?"
          hint="Cheaper than testers and feedback bought separately."
        >
          <div className="field">
            <label htmlFor="combo_pack">Pack</label>
            <ChoiceTiles
              id="combo_pack"
              name="combo_pack"
              label="Pack"
              required
              value={packId}
              onChange={(next) => setPackId(next as ComboPackId)}
              options={COMBO_PACKS.map((item) => ({
                value: item.id,
                label: item.label,
                hint: formatDots(item.credits),
              }))}
            />
          </div>
        </QuestionStep>
        <QuestionStep question="App or game?">
          <ProductTypeField value={productType} onProductTypeChange={setProductType} />
        </QuestionStep>
        <QuestionStep
          question={productType === "game" ? "What's the game called?" : "What's the app called?"}
        >
          <div className="field">
            <label htmlFor="app_name">
              {productType === "game" ? "Game name" : "App name"}
            </label>
            <input
              id="app_name"
              name="app_name"
              className="input"
              required
              placeholder={productType === "game" ? "Pinefolk Tavern" : "MyApp"}
            />
          </div>
        </QuestionStep>
        <QuestionStep question="Add an icon?" hint="Optional. Skip if you don't have one.">
          <ProductImageField productType={productType} />
        </QuestionStep>
        <QuestionStep question="Where can people open it?">
          <div className="field">
            <label htmlFor="app_url">
              {productType === "game" ? "Store or page URL" : "App URL"}
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
        </QuestionStep>
        <QuestionStep question="What does it do?">
          <div className="field">
            <label htmlFor="app_description">Description</label>
            <textarea
              id="app_description"
              name="app_description"
              className="textarea"
              required
              minLength={20}
              placeholder={descriptionPlaceholder}
            />
          </div>
        </QuestionStep>
        <QuestionStep question="Where does it live?">
          <PlatformField
            productType={productType}
            value={platform}
            onPlatformChange={setPlatform}
          />
          <div className="mt-4 space-y-3">
            <PlatformDistributionHint platform={platform} productType={productType} />
            <PublishingTipsPanel platform={platform} productType={productType} />
          </div>
        </QuestionStep>
        {needsAccess ? (
          <QuestionStep question="How do testers get in?">
            <BetaAccessLinkField platform={platform} />
          </QuestionStep>
        ) : null}
        <QuestionStep question="What should they focus on?">
          <div className="field">
            <label htmlFor="test_focus">What to focus on</label>
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
        </QuestionStep>
        <QuestionStep question="When does it start?">
          <div className="field">
            <label htmlFor="test_start_date">Start date</label>
            <input
              id="test_start_date"
              name="test_start_date"
              type="date"
              className="input font-mono"
              required
            />
          </div>
        </QuestionStep>
        <QuestionStep question="How many days?">
          <div className="field">
            <label htmlFor="duration_days">Test length</label>
            <ChoiceTiles
              id="duration_days"
              name="duration_days"
              label="Test length"
              required
              value={durationDays}
              onChange={setDurationDays}
              options={TESTER_DURATION_OPTIONS.map((days) => ({
                value: String(days),
                label: `${days} days`,
              }))}
            />
          </div>
        </QuestionStep>
        <QuestionStep
          question="A throwaway login?"
          hint="Optional. A fake account so reviewers can try it. Never share a real login."
        >
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
          </div>
        </QuestionStep>
        <QuestionStep question="What do you want to know?">
          <QuestionBuilder
            key={pack.id}
            balance={balance}
            targetTotal={pack.questions}
            showCost={false}
          />
        </QuestionStep>
        <QuestionStep
          question="How should it rank?"
          hint="Higher priority pays helpers more and sits higher on the board."
        >
          <p className="mb-3 font-mono text-[14px]">
            {formatDots(pack.credits)} · {pack.testers} testers · {pack.questions}{" "}
            questions
            {short ? (
              <span className="text-flag"> · you have {formatDots(balance)}</span>
            ) : null}
          </p>
          {short ? (
            <p className="mb-3 text-[13px]">
              <DotsTopUpLink />
            </p>
          ) : null}
          <PriorityPicker baseCost={pack.credits} balance={balance} />
        </QuestionStep>
      </OneQuestionFlow>
    </form>
  );
}
