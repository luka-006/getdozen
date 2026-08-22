/** Geometry for the blocky Dozen D — shared by the UI mark, favicon, and OG image. */

export const DOZEN_MARK_BLUE = "#2B7FFF";
export const DOZEN_MARK_YELLOW = "#FFC53D";
export const DOZEN_MARK_INK = "#0B1F3A";
export const DOZEN_BRAND_BLUE = "#1E4FD8";

export type DozenMarkCell = {
  c: number;
  r: number;
  yellow?: boolean;
  soft?: boolean;
};

/** Cell positions for the blocky D (col, row). Yellow accent at (0,3). */
export const DOZEN_MARK_CELLS: DozenMarkCell[] = [
  { c: 0, r: 0 },
  { c: 1, r: 0 },
  { c: 2, r: 0 },
  { c: 3, r: 0 },
  { c: 4, r: 0 },
  { c: 0, r: 1 },
  { c: 0, r: 2 },
  { c: 0, r: 3, yellow: true },
  { c: 0, r: 4 },
  { c: 0, r: 5 },
  { c: 5, r: 1 },
  { c: 6, r: 2 },
  { c: 6, r: 3 },
  { c: 5, r: 4 },
  { c: 6, r: 4 },
  { c: 1, r: 5 },
  { c: 2, r: 5 },
  { c: 3, r: 5 },
  { c: 4, r: 5 },
  { c: 5, r: 5, soft: true },
];

export const DOZEN_MARK_VIEW = 32;
export const DOZEN_MARK_CELL = 3.05;
export const DOZEN_MARK_GAP = 0.7;
export const DOZEN_MARK_COLS = 7;
export const DOZEN_MARK_ROWS = 6;
export const DOZEN_MARK_RX = 0.72;
