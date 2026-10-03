/**
 * Geometry for the Dozen mark — the favicon in src/app/icon.svg — shared by
 * the site logo, the generated icons, and the OG image.
 *
 * The D is twenty rounded pixels on a 32-unit navy tile, with one
 * credit-yellow pixel on the stem. The wordmark sets "ozen" in the same
 * pixels: same size, gap, and corner radius.
 */

export const DOZEN_MARK_INK = "#0B1F3A";
export const DOZEN_MARK_BLUE = "#2B7FFF";
export const DOZEN_MARK_YELLOW = "#FFC53D";
export const DOZEN_BRAND_BLUE = "#1E4FD8";

export const DOZEN_TILE = 32;
export const DOZEN_TILE_RX = 6;
export const DOZEN_CELL = 3.05;
export const DOZEN_CELL_RX = 0.72;
/** Outer corner radius of the D's last bowl pixel. */
export const DOZEN_SOFT_RX = 1.55;
export const DOZEN_PITCH = 3.75;
export const DOZEN_X0 = 3.225;
export const DOZEN_Y0 = 5.1;

export type DozenCell = {
  c: number;
  r: number;
  credit?: boolean;
  soft?: boolean;
  /** Part of "ozen" rather than the D. */
  word?: boolean;
};

/** The D, in icon.svg order. */
export const DOZEN_D_CELLS: DozenCell[] = [
  { c: 0, r: 0 },
  { c: 1, r: 0 },
  { c: 2, r: 0 },
  { c: 3, r: 0 },
  { c: 4, r: 0 },
  { c: 0, r: 1 },
  { c: 0, r: 2 },
  { c: 0, r: 3, credit: true },
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

/** Five-row lowercase on the D's bottom five rows. */
const GLYPHS = [
  [".##.", "#..#", "#..#", "#..#", ".##."],
  ["####", "..#.", ".#..", "#...", "####"],
  [".##.", "#..#", "####", "#...", ".###"],
  ["###.", "#..#", "#..#", "#..#", "#..#"],
];

function wordCells(): DozenCell[] {
  const cells: DozenCell[] = [];
  let col = 8;
  for (const glyph of GLYPHS) {
    glyph.forEach((row, r) => {
      [...row].forEach((on, c) => {
        if (on === "#") cells.push({ c: col + c, r: r + 1, word: true });
      });
    });
    col += glyph[0].length + 1;
  }
  return cells;
}

/** "Dozen": the favicon D followed by "ozen" in the same pixels. */
export const DOZEN_WORD_CELLS: DozenCell[] = [...DOZEN_D_CELLS, ...wordCells()];
export const DOZEN_WORD_COLS = 27;

export function dozenCellX(c: number) {
  return DOZEN_X0 + c * DOZEN_PITCH;
}

export function dozenCellY(r: number) {
  return DOZEN_Y0 + r * DOZEN_PITCH;
}

/** A pixel whose bottom-right corner is softened, as drawn in icon.svg. */
export function dozenSoftCellPath(c: number, r: number) {
  const x = dozenCellX(c);
  const y = dozenCellY(r);
  const s = DOZEN_CELL;
  const k = DOZEN_CELL_RX;
  const R = DOZEN_SOFT_RX;
  const n = (v: number) => v.toFixed(3);
  return [
    `M${n(x + k)} ${n(y)}`,
    `H${n(x + s - k)}`,
    `Q${n(x + s)} ${n(y)} ${n(x + s)} ${n(y + k)}`,
    `V${n(y + s - R)}`,
    `Q${n(x + s)} ${n(y + s)} ${n(x + s - R)} ${n(y + s)}`,
    `H${n(x + k)}`,
    `Q${n(x)} ${n(y + s)} ${n(x)} ${n(y + s - k)}`,
    `V${n(y + k)}`,
    `Q${n(x)} ${n(y)} ${n(x + k)} ${n(y)}`,
    "Z",
  ].join(" ");
}

/** viewBox of the pixels alone, without the tile. */
export function dozenPixelBox(cols: number) {
  return {
    x: DOZEN_X0,
    y: DOZEN_Y0,
    w: (cols - 1) * DOZEN_PITCH + DOZEN_CELL,
    h: 5 * DOZEN_PITCH + DOZEN_CELL,
  };
}
