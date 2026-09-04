"use client";

import type { ProductType } from "@/lib/constants";
import { PRODUCT_TYPES } from "@/lib/constants";
import { PRODUCT_TYPE_LABELS } from "@/lib/platform-labels";
import { StarIcon } from "@/components/icons";

function RequiredMark() {
  return (
    <span className="ml-1 inline-flex text-flag" title="Required" aria-label="required">
      <StarIcon />
    </span>
  );
}

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
        <RequiredMark />
      </label>
      <select
        id="product_type"
        name="product_type"
        className="select"
        value={value}
        required
        onChange={(e) => onProductTypeChange?.(e.target.value as ProductType)}
      >
        {PRODUCT_TYPES.map((type) => (
          <option key={type} value={type}>
            {PRODUCT_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
      <p className="text-[12px] text-ink/55">
        Apps and games use the same feedback and tester tracks.
      </p>
    </div>
  );
}
