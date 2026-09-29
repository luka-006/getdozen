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
          "inline-block translate-y-[-0.06em]",
          wordmarkClassName ?? defaultWordmarkClass,
        )}
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
  const layout = cn("inline-flex items-center gap-1.5 text-ink", className);

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
