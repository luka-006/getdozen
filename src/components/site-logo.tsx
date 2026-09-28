import Link from "next/link";
import { DozenMark } from "@/components/dozen-mark";
import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  tick?: boolean;
};

const defaultWordmarkClass =
  "font-display text-[18px] font-bold leading-none tracking-[-0.02em] text-ink";

/** Ring “o” echoes the dozen-dot mark — reads as Dozen with the D mark. */
function WordmarkO({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative inline-block h-[0.78em] w-[0.78em] align-[-0.1em]", className)}
      aria-hidden
    >
      <svg viewBox="0 0 16 16" className="h-full w-full" aria-hidden>
        <circle
          cx="8"
          cy="8"
          r="5.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
        />
        <circle cx="10.6" cy="10.6" r="1.65" className="fill-credit" />
      </svg>
    </span>
  );
}

function LogoContent({
  markClassName,
  wordmarkClassName,
  tick,
}: Pick<Props, "markClassName" | "wordmarkClassName" | "tick">) {
  return (
    <>
      <DozenMark
        className={cn("block shrink-0", markClassName ?? "h-8 w-8")}
        title="Dozen"
        tick={tick}
      />
      <span
        className={cn(
          "inline-flex items-baseline gap-0 translate-y-[-0.06em]",
          wordmarkClassName ?? defaultWordmarkClass,
        )}
      >
        <WordmarkO />
        <span>zen</span>
      </span>
    </>
  );
}

/** Site wordmark: dozen-ring D mark + fused “ozen” (reads as Dozen). */
export function SiteLogo({
  href,
  className = "",
  markClassName,
  wordmarkClassName,
  tick,
}: Props) {
  const layout = cn("inline-flex items-center gap-1 text-ink", className);

  if (href) {
    return (
      <Link href={href} className={layout} aria-label="Dozen">
        <LogoContent
          markClassName={markClassName}
          wordmarkClassName={wordmarkClassName}
          tick={tick}
        />
      </Link>
    );
  }

  return (
    <div className={layout}>
      <LogoContent
        markClassName={markClassName}
        wordmarkClassName={wordmarkClassName}
        tick={tick}
      />
    </div>
  );
}
