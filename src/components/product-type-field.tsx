"use client";

import { ChoiceTiles } from "@/components/choice-tiles";
import { StarIcon } from "@/components/icons";
import type { ProductType } from "@/lib/constants";
import { PRODUCT_TYPES } from "@/lib/constants";
import { PRODUCT_TYPE_LABELS } from "@/lib/platform-labels";

type Props = {
  value?: ProductType;
  onProductTypeChange?: (type: ProductType) => void;
};

export function ProductTypeField({
  value = "app",
  onProductTypeChange,
}: Props) {
  return (
    <div className="field">
      <label htmlFor="product_type">
        Product type
        <span className="ml-1 inline-flex text-flag" title="Required" aria-label="required">
          <StarIcon />
        </span>
      </label>
      <ChoiceTiles
        id="product_type"
        name="product_type"
        label="Product type"
        value={value}
        required
        options={PRODUCT_TYPES.map((type) => ({
          value: type,
          label: PRODUCT_TYPE_LABELS[type],
        }))}
        onChange={(next) => onProductTypeChange?.(next as ProductType)}
      />
      <p className="text-[12px] text-ink/55 max-md:hidden">
        Apps and games use the same feedback and tester tracks.
      </p>
    </div>
  );
}
