"use client";

import { StarIcon } from "@/components/icons";
import type { Platform } from "@/lib/constants";
import {
  betaAccessLinkHint,
  betaAccessLinkLabel,
  betaAccessLinkPlaceholder,
  betaAccessLinkRequired,
} from "@/lib/platform-access";

function RequiredMark() {
  return (
    <span className="ml-1 inline-flex text-flag" title="Required" aria-label="required">
      <StarIcon />
    </span>
  );
}

export function BetaAccessLinkField({ platform }: { platform: Platform }) {
  const required = betaAccessLinkRequired(platform);

  return (
    <div className="field">
      <label htmlFor="opt_in_link">
        {betaAccessLinkLabel(platform)}
        {required ? <RequiredMark /> : null}
      </label>
      <input
        id="opt_in_link"
        name="opt_in_link"
        type="url"
        className="input"
        required={required}
        placeholder={betaAccessLinkPlaceholder(platform)}
      />
      <p className="text-[12px] text-ink/55">{betaAccessLinkHint(platform)}</p>
    </div>
  );
}
