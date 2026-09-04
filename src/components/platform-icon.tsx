import type { Platform } from "@/lib/constants";
import { PLATFORM_LABELS } from "@/lib/platform-labels";

type Props = {
  platform: Platform | string;
  className?: string;
  showLabel?: boolean;
};

/** Abstract platform badges — not official store logos. */
export function PlatformIcon({ platform, className = "h-4 w-4", showLabel }: Props) {
  const key = platform as Platform;
  const label = PLATFORM_LABELS[key] ?? platform;

  return (
    <span className="inline-flex items-center gap-1 text-ink/70">
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        {key === "web" ? (
          <>
            <rect x="3" y="5" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 19h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : key === "ios" ? (
          <>
            <rect x="7" y="3" width="10" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="17.5" r="1" fill="currentColor" />
          </>
        ) : key === "android" ? (
          <>
            <path d="M8 8l-2-3M16 8l2-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="6" y="8" width="12" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
          </>
        ) : key === "steam" ? (
          <>
            <circle cx="8" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="16" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.2 13.8 14.2 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : key === "itch" ? (
          <>
            <path
              d="M12 5c-3 0-5 2.5-5 5.5S9 18 12 19s5-4 5-8.5S15 5 12 5Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M9.5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : (
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
        )}
      </svg>
      {showLabel ? <span className="text-[12px]">{label}</span> : null}
    </span>
  );
}
