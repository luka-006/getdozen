import Link from "next/link";
import { DozenPixels } from "@/components/dozen-mark";
import { DOZEN_WORD_CELLS, DOZEN_WORD_COLS, dozenPixelBox } from "@/lib/dozen-mark-data";
import { cn } from "@/lib/utils";

const BOX = dozenPixelBox(DOZEN_WORD_COLS);

type Props = {
  href?: string;
  className?: string;
  /** Font size of the lockup: the wordmark is 1em tall. */
  sizeClassName?: string;
  /** "dark" sets "ozen" in white for navy backgrounds. */
  tone?: "light" | "dark";
  tick?: boolean;
};

function Wordmark({ tick }: Pick<Props, "tick">) {
  return (
    <svg
      viewBox={`${BOX.x} ${BOX.y} ${BOX.w} ${BOX.h}`}
      aria-hidden="true"
      className={cn("block h-[1em] overflow-visible", tick && "dozen-count")}
      style={{ width: `${(BOX.w / BOX.h).toFixed(4)}em` }}
    >
      <DozenPixels cells={DOZEN_WORD_CELLS} animated />
    </svg>
  );
}

/**
 * Site wordmark: "Dozen" in the favicon's rounded pixels — the real D, then
 * "ozen" in the same pixels. Each dot is a person in the dozen.
 */
export function SiteLogo({
  href,
  className,
  sizeClassName = "text-[24px]",
  tone = "light",
  tick,
}: Props) {
  const layout = cn(
    "dozen-logo inline-block leading-none",
    tone === "dark" ? "text-white" : "text-ink",
    sizeClassName,
    className,
  );

  if (href) {
    return (
      <Link href={href} className={layout} aria-label="Dozen">
        <Wordmark tick={tick} />
      </Link>
    );
  }

  return (
    <div className={layout} role="img" aria-label="Dozen">
      <Wordmark tick={tick} />
    </div>
  );
}
