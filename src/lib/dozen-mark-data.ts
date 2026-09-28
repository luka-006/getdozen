/** Geometry for the Dozen D — shared by the UI mark, favicon, and OG image. */

export const DOZEN_MARK_BLUE = "#1E4FD8";
export const DOZEN_MARK_YELLOW = "#FFC53D";
export const DOZEN_MARK_INK = "#0B1F3A";
export const DOZEN_BRAND_BLUE = "#1E4FD8";

export type DozenMarkCell = {
  c: number;
  r: number;
  yellow?: boolean;
  soft?: boolean;
};

/**
 * Twelve dots form the capital D (a literal dozen). One credit-yellow dot sits
 * in the bowl — feedback / dots earned on the platform.
 */
export const DOZEN_MARK_CELLS: DozenMarkCell[] = [
  { c: 0, r: 0 },
  { c: 1, r: 0 },
  { c: 2, r: 0 },
  { c: 0, r: 1 },
  { c: 3, r: 1 },
  { c: 0, r: 2 },
  { c: 3, r: 2 },
  { c: 0, r: 3 },
  { c: 2, r: 3, yellow: true },
  { c: 3, r: 3 },
  { c: 0, r: 4 },
  { c: 1, r: 4 },
];

export const DOZEN_MARK_VIEW = 32;
export const DOZEN_MARK_CELL = 3.35;
export const DOZEN_MARK_GAP = 0.62;
export const DOZEN_MARK_COLS = 4;
export const DOZEN_MARK_ROWS = 5;
export const DOZEN_MARK_RX = 0.78;
