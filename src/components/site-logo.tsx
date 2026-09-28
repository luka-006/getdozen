import Link from "next/link";
import { DozenMark } from "@/components/dozen-mark";

type Props = {
  href?: string;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  tick?: boolean;
};

function LogoContent({
  markClassName,
  wordmarkClassName,
  tick,
}: Pick<Props, "markClassName" | "wordmarkClassName" | "tick">) {
  return (
    <>
      <DozenMark
        className={markClassName ?? "h-8 w-8 shrink-0"}
        title="Dozen"
        tick={tick}
      />
      <span
        className={
          wordmarkClassName ??
          "font-display text-[17px] font-bold leading-none tracking-[-0.02em] text-ink"
        }
      >
        ozen
      </span>
    </>
  );
}

/** Site wordmark: blocky D mark + "ozen" (reads as Dozen). */
export function SiteLogo({
  href,
  className = "",
  markClassName,
  wordmarkClassName,
  tick,
}: Props) {
  const layout = `flex items-baseline gap-1 text-ink ${className}`.trim();

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
