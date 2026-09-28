import type { Platform } from "@/lib/constants";
import { PLATFORM_LABELS } from "@/lib/platform-labels";

type Props = {
  platform: Platform | string;
  className?: string;
  showLabel?: boolean;
};

/** Simplified, brand-inspired platform marks — not official logos. */
export function PlatformIcon({ platform, className = "h-4 w-4", showLabel }: Props) {
  const key = platform as Platform;
  const label = PLATFORM_LABELS[key] ?? platform;

  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-ink/70">
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        {key === "android" ? (
          <>
            <rect x="5" y="9" width="14" height="10" rx="4" fill="#3DDC84" />
            <circle cx="9.5" cy="13.5" r="1.25" fill="#1B4332" />
            <circle cx="14.5" cy="13.5" r="1.25" fill="#1B4332" />
            <rect x="7" y="5.5" width="2" height="4" rx="1" fill="#3DDC84" />
            <rect x="15" y="5.5" width="2" height="4" rx="1" fill="#3DDC84" />
          </>
        ) : key === "ios" ? (
          <>
            <rect x="4" y="4" width="16" height="16" rx="4.5" fill="#007AFF" />
            <path
              d="M12 7.5 16.5 16.5H7.5L12 7.5Z"
              fill="#fff"
              fillOpacity="0.95"
            />
          </>
        ) : key === "steam" ? (
          <>
            <circle cx="12" cy="12" r="10" fill="#1B2838" />
            <circle cx="8.5" cy="14.5" r="3.25" fill="#66C0F4" />
            <circle cx="8.5" cy="14.5" r="1.4" fill="#1B2838" />
            <circle cx="15.5" cy="9.5" r="2.75" fill="#66C0F4" />
            <path
              d="M10.8 12.8 13.8 10.2"
              stroke="#C7D5E0"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </>
        ) : key === "itch" ? (
          <>
            <path
              d="M12 4.5c-3.8 0-6 3-6 6.8 0 3.2 2.2 7.2 6 8.7 3.8-1.5 6-5.5 6-8.7 0-3.8-2.2-6.8-6-6.8Z"
              fill="#FA5C5C"
            />
            <circle cx="9.5" cy="11.5" r="1.1" fill="#fff" />
            <circle cx="14.5" cy="11.5" r="1.1" fill="#fff" />
            <path
              d="M10 14.5h4"
              stroke="#fff"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </>
        ) : key === "web" ? (
          <>
            <circle cx="12" cy="12" r="9" fill="#4285F4" />
            <ellipse cx="12" cy="12" rx="4.5" ry="9" fill="none" stroke="#fff" strokeWidth="1.25" />
            <path d="M3.5 12h17" stroke="#fff" strokeWidth="1.25" />
            <path
              d="M5 8h14M5 16h14"
              stroke="#fff"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.85"
            />
          </>
        ) : key === "other" ? (
          <>
            <rect x="4" y="4" width="16" height="16" rx="4" fill="#94A3B8" />
            <circle cx="8.5" cy="12" r="1.35" fill="#fff" />
            <circle cx="12" cy="12" r="1.35" fill="#fff" />
            <circle cx="15.5" cy="12" r="1.35" fill="#fff" />
          </>
        ) : (
          <>
            <rect x="4" y="4" width="16" height="16" rx="4" fill="#94A3B8" />
            <circle cx="8.5" cy="12" r="1.35" fill="#fff" />
            <circle cx="12" cy="12" r="1.35" fill="#fff" />
            <circle cx="15.5" cy="12" r="1.35" fill="#fff" />
          </>
        )}
      </svg>
      {showLabel ? <span className="text-[12px]">{label}</span> : null}
    </span>
  );
}
