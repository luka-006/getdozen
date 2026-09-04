"use client";

import { platformsForProductType, type Platform, type ProductType } from "@/lib/constants";
import { PLATFORM_LABELS } from "@/lib/platform-labels";
import { StarIcon } from "@/components/icons";
import { PlatformIcon } from "@/components/platform-icon";

function RequiredMark() {
  return (
    <span className="ml-1 inline-flex text-flag" title="Required" aria-label="required">
      <StarIcon />
    </span>
  );
}

type Props = {
  productType?: ProductType;
  defaultValue?: Platform;
  required?: boolean;
  onPlatformChange?: (platform: Platform) => void;
};

export function PlatformField({
  productType = "app",
  defaultValue,
  required = true,
  onPlatformChange,
}: Props) {
  const options = platformsForProductType(productType);
  const initial = defaultValue ?? options[0];

  return (
    <div className="field">
      <label htmlFor="platform">
        Platform
        {required ? <RequiredMark /> : null}
      </label>
      <select
        id="platform"
        name="platform"
        className="select"
        defaultValue={initial}
        key={`${productType}-${initial}`}
        required={required}
        onChange={(e) => onPlatformChange?.(e.target.value as Platform)}
      >
        {options.map((p) => (
          <option key={p} value={p}>
            {PLATFORM_LABELS[p]}
          </option>
        ))}
      </select>
      <div className="mt-2 flex flex-wrap gap-3">
        {options.map((p) => (
          <PlatformIcon key={p} platform={p} showLabel />
        ))}
      </div>
    </div>
  );
}
