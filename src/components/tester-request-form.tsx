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
  const [durationDays, setDurationDays] = useState("14");
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
  const needsAccess = platform !== "web" && platform !== "itch";

  const error = state.error ? (
    <div className="mb-4 space-y-2 rounded-[6px] border border-flag/30 bg-flag/5 px-3 py-2 text-[13px] text-flag">
      <p>{state.error}</p>
      <DotsTopUpLink />
    </div>
  ) : null;

  return (
    <form action={formAction} encType="multipart/form-data" className="mt-6 md:mt-8">
      <OneQuestionFlow pending={pending} error={error}>
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
              placeholder={productType === "game" ? "Starlit Courier" : "MyApp"}
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
        <QuestionStep question="How many testers?" hint="A dozen is the minimum.">
          <div className="field">
            <label htmlFor="testers_needed">Testers needed</label>
            <ChoiceTiles
              id="testers_needed"
              name="testers_needed"
              label="Testers needed"
              required
              value={String(testersNeeded)}
              onChange={(next) => setTestersNeeded(Number(next))}
              options={TESTER_COUNT_OPTIONS.map((count) => ({
                value: String(count),
                label: `${count} testers`,
                hint: formatDots(count * TESTER_COST),
              }))}
            />
          </div>
          {short ? (
            <p className="mt-3 text-[13px] text-ink/65">
              You have {formatDots(balance)}. <DotsTopUpLink />
            </p>
          ) : null}
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
                  ? "First hour, controls, difficulty curve"
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
        <QuestionStep
          question="How should it rank?"
          hint="Higher priority pays testers more and sits higher on the board."
        >
          <PriorityPicker baseCost={baseCost} balance={balance} />
        </QuestionStep>
      </OneQuestionFlow>
    </form>
  );
}
