import type { CSSProperties } from "react";
import Link from "next/link";
import { DozenMark } from "@/components/dozen-mark";
import {
  DOZEN_MARK_CELL as CELL,
  DOZEN_MARK_COLS as COLS,
  DOZEN_MARK_GAP as GAP,
  DOZEN_MARK_ROWS as ROWS,
} from "@/lib/dozen-mark-data";
import { cn } from "@/lib/utils";

/** Archivo's cap height: the dotted D stands exactly as tall as a capital. */
const CAP_HEIGHT_EM = 0.686;
const GLYPH_ASPECT =
  (COLS * CELL + (COLS - 1) * GAP) / (ROWS * CELL + (ROWS - 1) * GAP);

const glyphStyle: CSSProperties = {
  height: `${CAP_HEIGHT_EM}em`,
  width: `${(CAP_HEIGHT_EM * GLYPH_ASPECT).toFixed(3)}em`,
  marginRight: "0.03em",
};

type Props = {
  href?: string;
  className?: string;
  /** Font size of the lockup; the D scales with it. */
  sizeClassName?: string;
  tick?: boolean;
};

function LogoContent({ tick }: Pick<Props, "tick">) {
  return (
    <>
      <DozenMark
        glyph
        tick={tick}
        className="inline-block align-baseline"
        style={glyphStyle}
      />
      <span aria-hidden="true">ozen</span>
    </>
  );
}

/** Site wordmark: the twelve-dot D is the capital of "Dozen". */
export function SiteLogo({
  href,
  className,
  sizeClassName = "text-[26px]",
  tick,
}: Props) {
  const layout = cn(
    "dozen-logo inline-block whitespace-nowrap font-display font-semibold leading-none tracking-[-0.02em] text-blue",
    sizeClassName,
    className,
  );

  if (href) {
    return (
      <Link href={href} className={layout} aria-label="Dozen">
        <LogoContent tick={tick} />
      </Link>
    );
  }

  return (
    <div className={layout} role="img" aria-label="Dozen">
      <LogoContent tick={tick} />
    </div>
  );
}
