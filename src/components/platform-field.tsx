"use client";

import { StarIcon } from "@/components/icons";
import { PLATFORMS, type Platform } from "@/lib/constants";

const LABELS: Record<Platform, string> = {
  web: "Web",
  ios: "iOS",
  android: "Android",
};

function RequiredMark() {
  return (
    <span className="ml-1 inline-flex text-flag" title="Required" aria-label="required">
      <StarIcon />
    </span>
  );
}

type Props = {
  defaultValue?: Platform;
  required?: boolean;
  onPlatformChange?: (platform: Platform) => void;
};

export function PlatformField({
  defaultValue = "web",
  required = true,
  onPlatformChange,
}: Props) {
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
        defaultValue={defaultValue}
        required={required}
        onChange={(e) => onPlatformChange?.(e.target.value as Platform)}
      >
        {PLATFORMS.map((p) => (
          <option key={p} value={p}>
            {LABELS[p]}
          </option>
        ))}
      </select>
    </div>
  );
}
