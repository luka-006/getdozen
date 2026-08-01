type Props = {
  className?: string;
  title?: string;
};

const BLUE = "#2B7FFF";
const YELLOW = "#FFC53D";

/** Cell positions for the blocky D (col, row). Yellow accent at (0,3). */
const CELLS: Array<{ c: number; r: number; yellow?: boolean; soft?: boolean }> = [
  // top bar
  { c: 0, r: 0 },
  { c: 1, r: 0 },
  { c: 2, r: 0 },
  { c: 3, r: 0 },
  { c: 4, r: 0 },
  // stem
  { c: 0, r: 1 },
  { c: 0, r: 2 },
  { c: 0, r: 3, yellow: true },
  { c: 0, r: 4 },
  { c: 0, r: 5 },
  // right curve
  { c: 5, r: 1 },
  { c: 6, r: 2 },
  { c: 6, r: 3 },
  { c: 5, r: 4 },
  { c: 6, r: 4 },
  // bottom bar (excl. stem)
  { c: 1, r: 5 },
  { c: 2, r: 5 },
  { c: 3, r: 5 },
  { c: 4, r: 5 },
  { c: 5, r: 5, soft: true },
];

/**
 * Dozen mark — blocky D (blue cells + one credit-yellow tick).
 */
export function DozenMark({ className = "h-8 w-8", title }: Props) {
  const cell = 3.05;
  const gap = 0.7;
  const cols = 7;
  const rows = 6;
  const gridW = cols * cell + (cols - 1) * gap;
  const gridH = rows * cell + (rows - 1) * gap;
  const ox = (32 - gridW) / 2;
  const oy = (32 - gridH) / 2;
  const rx = 0.72;

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
        if (soft) {
          const R = 1.55;
          return (
            <path
              key={`${c}-${r}`}
              fill={fill}
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
          />
        );
      })}
    </svg>
  );
}
