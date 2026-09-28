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
          "font-display text-[18px] font-semibold tracking-[0.03em]"
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
  const layout = `flex items-center gap-1.5 text-ink ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={layout}>
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
