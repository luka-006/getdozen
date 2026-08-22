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

type Props = {
  className?: string;
  title?: string;
  /** One subtle yellow-cell tick on load (landing hero). */
  tick?: boolean;
};

/**
 * Dozen mark — blocky D (blue cells + one credit-yellow tick).
 */
export function DozenMark({ className = "h-8 w-8", title, tick }: Props) {
  const cell = DOZEN_MARK_CELL;
  const gap = DOZEN_MARK_GAP;
  const cols = DOZEN_MARK_COLS;
  const rows = DOZEN_MARK_ROWS;
  const gridW = cols * cell + (cols - 1) * gap;
  const gridH = rows * cell + (rows - 1) * gap;
  const ox = (DOZEN_MARK_VIEW - gridW) / 2;
  const oy = (DOZEN_MARK_VIEW - gridH) / 2;
  const rx = DOZEN_MARK_RX;

  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {CELLS.map(({ c, r, yellow, soft }) => {
        const x = ox + c * (cell + gap);
        const y = oy + r * (cell + gap);
        const fill = yellow ? YELLOW : BLUE;
        const tickClass = yellow && tick ? "dozen-tick" : undefined;
        if (soft) {
          const R = 1.55;
          return (
            <path
              key={`${c}-${r}`}
              fill={fill}
              className={tickClass}
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
            className={tickClass}
          />
        );
      })}
    </svg>
  );
}
