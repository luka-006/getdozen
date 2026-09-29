import {
  DOZEN_MARK_BLUE,
  DOZEN_MARK_CELL,
  DOZEN_MARK_CELLS,
  DOZEN_MARK_COLS,
  DOZEN_MARK_GAP,
  DOZEN_MARK_INK,
  DOZEN_MARK_ROWS,
  DOZEN_MARK_RX,
  DOZEN_MARK_VIEW,
  DOZEN_MARK_YELLOW,
} from "@/lib/dozen-mark-data";

/** Flexbox mark for `next/og` ImageResponse (no CSS grid). */
export function DozenMarkBoxes({
  size,
  background,
}: {
  size: number;
  background?: string;
}) {
  const scale = size / DOZEN_MARK_VIEW;
  const cell = DOZEN_MARK_CELL * scale;
  const gap = DOZEN_MARK_GAP * scale;
  const rx = Math.max(1, DOZEN_MARK_RX * scale);
  const gridW = DOZEN_MARK_COLS * cell + (DOZEN_MARK_COLS - 1) * gap;
  const gridH = DOZEN_MARK_ROWS * cell + (DOZEN_MARK_ROWS - 1) * gap;
  const ox = (size - gridW) / 2;
  const oy = (size - gridH) / 2;

  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        position: "relative",
        background: background ?? DOZEN_MARK_INK,
        borderRadius: Math.round(size * 0.18),
      }}
    >
      {DOZEN_MARK_CELLS.map(({ c, r, yellow }) => (
        <div
          key={`${c}-${r}`}
          style={{
            position: "absolute",
            left: ox + c * (cell + gap),
            top: oy + r * (cell + gap),
            width: cell,
            height: cell,
            background: yellow ? DOZEN_MARK_YELLOW : DOZEN_MARK_BLUE,
            borderRadius: rx,
          }}
        />
      ))}
    </div>
  );
}
