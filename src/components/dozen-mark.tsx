import type { CSSProperties } from "react";
import {
  DOZEN_MARK_BLUE as BLUE,
  DOZEN_MARK_CELL,
  DOZEN_MARK_CELLS as CELLS,
  DOZEN_MARK_COLS,
  DOZEN_MARK_GAP,
  DOZEN_MARK_ROWS,
  DOZEN_MARK_RX,
  DOZEN_MARK_VIEW,
  DOZEN_MARK_YELLOW as YELLOW,
} from "@/lib/dozen-mark-data";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  style?: CSSProperties;
  title?: string;
  /** Count the dots in once on load (landing hero). */
  tick?: boolean;
  /** Crop to the dots so the D can stand in for a letter. */
  glyph?: boolean;
};

/**
 * Dozen mark — twelve dots form a capital D; one credit-yellow dot in the bowl.
 */
export function DozenMark({
  className = "h-8 w-8",
  style,
  title,
  tick,
  glyph,
}: Props) {
  const cell = DOZEN_MARK_CELL;
  const gap = DOZEN_MARK_GAP;
  const cols = DOZEN_MARK_COLS;
  const rows = DOZEN_MARK_ROWS;
  const gridW = cols * cell + (cols - 1) * gap;
  const gridH = rows * cell + (rows - 1) * gap;
  const ox = glyph ? 0 : (DOZEN_MARK_VIEW - gridW) / 2;
  const oy = glyph ? 0 : (DOZEN_MARK_VIEW - gridH) / 2;
  const rx = DOZEN_MARK_RX;

  return (
    <svg
      viewBox={
        glyph
          ? `0 0 ${gridW} ${gridH}`
          : `0 0 ${DOZEN_MARK_VIEW} ${DOZEN_MARK_VIEW}`
      }
      className={cn(className, tick && "dozen-count")}
      style={style}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {CELLS.map(({ c, r, yellow, soft }, i) => {
        const x = ox + c * (cell + gap);
        const y = oy + r * (cell + gap);
        const fill = yellow ? YELLOW : BLUE;
        const dot = {
          className: yellow ? "dozen-dot dozen-dot-credit" : "dozen-dot",
          style: { "--i": i } as CSSProperties,
        };
        if (soft) {
          const R = 1.55;
          return (
            <path
              key={`${c}-${r}`}
              fill={fill}
              {...dot}
              d={[
                `M${x + rx} ${y}`,
                `H${x + cell - rx}`,
                `Q${x + cell} ${y} ${x + cell} ${y + rx}`,
                `V${y + cell - R}`,
                `Q${x + cell} ${y + cell} ${x + cell - R} ${y + cell}`,
                `H${x + rx}`,
                `Q${x} ${y + cell} ${x} ${y + cell - rx}`,
                `V${y + rx}`,
                `Q${x} ${y} ${x + rx} ${y}`,
                "Z",
              ].join(" ")}
            />
          );
        }
        return (
          <rect
            key={`${c}-${r}`}
            x={x}
            y={y}
            width={cell}
            height={cell}
            rx={rx}
            fill={fill}
            {...dot}
          />
        );
      })}
    </svg>
  );
}
