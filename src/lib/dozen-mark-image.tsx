import {
  DOZEN_CELL,
  DOZEN_CELL_RX,
  DOZEN_D_CELLS,
  DOZEN_MARK_BLUE,
  DOZEN_MARK_INK,
  DOZEN_MARK_YELLOW,
  DOZEN_SOFT_RX,
  DOZEN_TILE,
  DOZEN_TILE_RX,
  DOZEN_WORD_CELLS,
  DOZEN_WORD_COLS,
  dozenCellX,
  dozenCellY,
  dozenPixelBox,
  type DozenCell,
} from "@/lib/dozen-mark-data";

/**
 * Absolutely placed pixels for `next/og` ImageResponse (no SVG or grid).
 * A plain function, not a component: Satori cannot render a component that
 * returns an array.
 */
function pixelBoxes(
  cells: DozenCell[],
  scale: number,
  offsetX: number,
  offsetY: number,
  wordColor: string,
) {
  const rx = Math.max(1, DOZEN_CELL_RX * scale);
  return cells.map(({ c, r, credit, soft, word }) => (
    <div
      key={`${c}-${r}`}
      style={{
        position: "absolute",
        left: (dozenCellX(c) - offsetX) * scale,
        top: (dozenCellY(r) - offsetY) * scale,
        width: DOZEN_CELL * scale,
        height: DOZEN_CELL * scale,
        background: word ? wordColor : credit ? DOZEN_MARK_YELLOW : DOZEN_MARK_BLUE,
        borderTopLeftRadius: rx,
        borderTopRightRadius: rx,
        borderBottomLeftRadius: rx,
        borderBottomRightRadius: soft ? DOZEN_SOFT_RX * scale : rx,
      }}
    />
  ));
}

/** The favicon: navy rounded tile with the pixel D. */
export function DozenMarkBoxes({ size }: { size: number }) {
  const scale = size / DOZEN_TILE;
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: size,
        height: size,
        background: DOZEN_MARK_INK,
        borderRadius: DOZEN_TILE_RX * scale,
      }}
    >
      {pixelBoxes(DOZEN_D_CELLS, scale, 0, 0, DOZEN_MARK_BLUE)}
    </div>
  );
}

/** "Dozen" in the favicon's pixels, `height` px tall. */
export function DozenWordBoxes({
  height,
  wordColor,
}: {
  height: number;
  wordColor: string;
}) {
  const box = dozenPixelBox(DOZEN_WORD_COLS);
  const scale = height / box.h;
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: box.w * scale,
        height,
      }}
    >
      {pixelBoxes(DOZEN_WORD_CELLS, scale, box.x, box.y, wordColor)}
    </div>
  );
}
