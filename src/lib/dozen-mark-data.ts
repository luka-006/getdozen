/** Geometry for the Dozen D mark — shared by UI, favicon, and OG image. */

export const DOZEN_MARK_BLUE = "#1E4FD8";
export const DOZEN_MARK_YELLOW = "#FFC53D";
export const DOZEN_MARK_INK = "#0B1F3A";
export const DOZEN_BRAND_BLUE = "#1E4FD8";

export const DOZEN_MARK_VIEW = 32;

/** Left spine of the D (viewBox units). */
export const DOZEN_MARK_SPINE = {
  x: 3.5,
  y: 6,
  width: 4.5,
  height: 20,
  rx: 2.25,
} as const;

/** Semicircular bowl: exactly twelve dots, one golden “earned” credit. */
export const DOZEN_MARK_ARC = {
  cx: 14,
  cy: 16,
  r: 9,
  startDeg: -74,
  endDeg: 74,
  count: 12,
  /** Lower-right dot — credits pooling / earned feedback. */
  goldenIndex: 9,
} as const;

export const DOZEN_MARK_DOT_R = 1.85;

export type DozenMarkDot = {
  x: number;
  y: number;
  golden?: boolean;
};

function arcDots(): DozenMarkDot[] {
  const { cx, cy, r, startDeg, endDeg, count, goldenIndex } = DOZEN_MARK_ARC;
  const dots: DozenMarkDot[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const deg = startDeg + (endDeg - startDeg) * t;
    const rad = (deg * Math.PI) / 180;
    dots.push({
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
      golden: i === goldenIndex,
    });
  }
  return dots;
}

export const DOZEN_MARK_DOTS = arcDots();
