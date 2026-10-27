"use client";

import { ChoiceTiles } from "@/components/choice-tiles";
import { StarIcon } from "@/components/icons";
import {
  platformsForProductType,
  type Platform,
  type ProductType,
} from "@/lib/constants";
import { PLATFORM_LABELS } from "@/lib/platform-labels";

type Props = {
  productType?: ProductType;
  value?: Platform;
  required?: boolean;
  onPlatformChange?: (platform: Platform) => void;
};

export function PlatformField({
  productType = "app",
  value,
  required = true,
  onPlatformChange,
}: Props) {
  const options = platformsForProductType(productType);
  const selected = value && options.includes(value) ? value : options[0]!;

  return (
    <div className="field">
      <label htmlFor="platform">
        Platform
        {required ? (
          <span className="ml-1 inline-flex text-flag" title="Required" aria-label="required">
            <StarIcon />
          </span>
        ) : null}
      </label>
      <ChoiceTiles
        id="platform"
        name="platform"
        label="Platform"
        value={selected}
        required={required}
        options={options.map((platform) => ({
          value: platform,
          label: PLATFORM_LABELS[platform],
        }))}
        onChange={(next) => onPlatformChange?.(next as Platform)}
      />
    </div>
  );
}
