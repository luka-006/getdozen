import type { CSSProperties } from "react";
import {
  DOZEN_CELL,
  DOZEN_CELL_RX,
  DOZEN_D_CELLS,
  DOZEN_MARK_BLUE,
  DOZEN_MARK_INK,
  DOZEN_MARK_YELLOW,
  DOZEN_TILE,
  DOZEN_TILE_RX,
  dozenCellX,
  dozenCellY,
  dozenPixelBox,
  dozenSoftCellPath,
  type DozenCell,
} from "@/lib/dozen-mark-data";

/**
 * Rounded pixels of the Dozen mark. D pixels keep the favicon colours; "ozen"
 * pixels take `wordFill`. With `animated`, pixels carry their column so the
 * logo can light up left to right, the credit pixel last.
 */
export function DozenPixels({
  cells,
  wordFill = "currentColor",
  animated,
}: {
  cells: DozenCell[];
  wordFill?: string;
  animated?: boolean;
}) {
  const lastCol = Math.max(...cells.map(({ c }) => c)) + 1;
  return cells.map(({ c, r, credit, soft, word }) => {
    const fill = word ? wordFill : credit ? DOZEN_MARK_YELLOW : DOZEN_MARK_BLUE;
    const motion = animated
      ? {
          className: credit ? "dozen-dot dozen-dot-credit" : "dozen-dot",
          style: { "--i": credit ? lastCol : c } as CSSProperties,
        }
      : {};
    if (soft) {
      return <path key={`${c}-${r}`} fill={fill} d={dozenSoftCellPath(c, r)} {...motion} />;
    }
    return (
      <rect
        key={`${c}-${r}`}
        x={dozenCellX(c).toFixed(3)}
        y={dozenCellY(r).toFixed(3)}
        width={DOZEN_CELL}
        height={DOZEN_CELL}
        rx={DOZEN_CELL_RX}
        fill={fill}
        {...motion}
      />
    );
  });
}

type Props = {
  className?: string;
  title?: string;
  /** Draw the navy rounded tile behind the D, as in the favicon. */
  tile?: boolean;
};

/** The Dozen favicon D, cell for cell. */
export function DozenMark({ className = "h-8 w-8", title, tile = true }: Props) {
  const box = dozenPixelBox(7);
  return (
    <svg
      viewBox={tile ? `0 0 ${DOZEN_TILE} ${DOZEN_TILE}` : `${box.x} ${box.y} ${box.w} ${box.h}`}
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {tile ? (
        <rect width={DOZEN_TILE} height={DOZEN_TILE} rx={DOZEN_TILE_RX} fill={DOZEN_MARK_INK} />
      ) : null}
      <DozenPixels cells={DOZEN_D_CELLS} />
    </svg>
  );
}
