"use client";

import { useActionState, useEffect, useState } from "react";
import { purchaseDotsAmount } from "@/actions/billing";
import { ChoiceTiles } from "@/components/choice-tiles";
import { DotsTopUpLink } from "@/components/dots-topup-link";
import { OneQuestionFlow, QuestionStep } from "@/components/one-question-flow";
import { QuestionBuilder } from "@/components/question-builder";
import { PriorityPicker } from "@/components/priority-picker";
import { ProductTypeField } from "@/components/product-type-field";
import { PlatformField } from "@/components/platform-field";
import { ProductImageField } from "@/components/product-image-field";
import { PublishingTipsPanel } from "@/components/publishing-tips-panel";
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
  const [focus, setFocus] = useState<string>("Everything");
  const [descriptionPlaceholder, setDescriptionPlaceholder] = useState(
    "What it does",
  );

  useEffect(() => {
    setDescriptionPlaceholder(randomDescriptionExample(productType));
  }, [productType]);

  useEffect(() => {
    setPlatform(defaultPlatformForProductType(productType));
  }, [productType]);

  const error = state.error ? (
    <div className="mb-4 space-y-2 rounded-[6px] border border-flag/30 bg-flag/5 px-3 py-2 text-[13px] text-flag">
      <p>{state.error}</p>
      <DotsTopUpLink />
    </div>
  ) : null;

  return (
    <>
      <form
        id="buy-dots-exact"
        action={purchaseDotsAmount}
        className="hidden"
      >
        <input type="hidden" name="return_to" value="/requests/new?type=feedback" />
      </form>

      <form action={formAction} encType="multipart/form-data" className="mt-6 md:mt-8">
        <OneQuestionFlow pending={pending} error={error}>
          <QuestionStep question="App or game?">
            <ProductTypeField
              value={productType}
              onProductTypeChange={setProductType}
            />
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
                placeholder={productType === "game" ? "Vaultbreaker 2084" : "MyApp"}
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
            <div className="mt-4">
              <PublishingTipsPanel platform={platform} productType={productType} />
            </div>
          </QuestionStep>
          <QuestionStep question="What should the review focus on?">
            <div className="field">
              <label htmlFor="focus_tag">Focus</label>
              <ChoiceTiles
                id="focus_tag"
                name="focus_tag"
                label="Focus"
                value={focus}
                onChange={setFocus}
                options={FOCUS_TAGS.map((tag) => ({ value: tag, label: tag }))}
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
            <QuestionBuilder balance={balance} />
          </QuestionStep>
          <QuestionStep
            question="How should it rank?"
            hint="Higher priority pays helpers more and sits higher on the board."
          >
            <PriorityPicker baseCost={10} balance={balance} />
          </QuestionStep>
        </OneQuestionFlow>
      </form>
    </>
  );
}
