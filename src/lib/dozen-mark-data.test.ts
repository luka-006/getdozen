import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  DOZEN_CELL,
  DOZEN_CELL_RX,
  DOZEN_D_CELLS,
  DOZEN_MARK_BLUE,
  DOZEN_MARK_INK,
  DOZEN_MARK_YELLOW,
  DOZEN_TILE,
  DOZEN_TILE_RX,
  DOZEN_WORD_CELLS,
  DOZEN_WORD_COLS,
  dozenCellX,
  dozenCellY,
  dozenSoftCellPath,
} from "./dozen-mark-data";

const n = (v: number) => String(Number(v.toFixed(3)));

function shapesFromSvg(svg: string) {
  return [...svg.matchAll(/<(rect|path)\b([^>]*?)\/?>/g)].map(([, tag, attrs]) => {
    const out: Record<string, string> = { tag };
    for (const [, k, v] of attrs.matchAll(/([a-z-]+)="([^"]*)"/gi)) {
      out[k] = /^-?[\d.]+$/.test(v) ? String(Number(v)) : v.replace(/\s+/g, " ").toUpperCase();
    }
    return out;
  });
}

function shapesFromData() {
  return [
    {
      tag: "rect",
      width: n(DOZEN_TILE),
      height: n(DOZEN_TILE),
      rx: n(DOZEN_TILE_RX),
      fill: DOZEN_MARK_INK,
    },
    ...DOZEN_D_CELLS.map(({ c, r, credit, soft }) =>
      soft
        ? { tag: "path", fill: DOZEN_MARK_BLUE, d: dozenSoftCellPath(c, r).toUpperCase() }
        : {
            tag: "rect",
            x: n(dozenCellX(c)),
            y: n(dozenCellY(r)),
            width: n(DOZEN_CELL),
            height: n(DOZEN_CELL),
            rx: n(DOZEN_CELL_RX),
            fill: credit ? DOZEN_MARK_YELLOW : DOZEN_MARK_BLUE,
          },
    ),
  ];
}

describe("dozen mark", () => {
  it("draws exactly the favicon in src/app/icon.svg", () => {
    const svg = readFileSync(join(process.cwd(), "src/app/icon.svg"), "utf8");
    assert.deepEqual(shapesFromData(), shapesFromSvg(svg));
  });

  it("has twenty pixels in the D, one of them the credit pixel", () => {
    assert.equal(DOZEN_D_CELLS.length, 20);
    assert.equal(DOZEN_D_CELLS.filter((cell) => cell.credit).length, 1);
  });

  it("sets ozen on the D's grid and bottom five rows", () => {
    const word = DOZEN_WORD_CELLS.filter((cell) => cell.word);
    assert.equal(word.length, 44);
    assert.ok(word.every(({ r }) => r >= 1 && r <= 5));
    assert.equal(Math.max(...word.map(({ c }) => c)), DOZEN_WORD_COLS - 1);
    const seen = new Set(DOZEN_WORD_CELLS.map(({ c, r }) => `${c},${r}`));
    assert.equal(seen.size, DOZEN_WORD_CELLS.length);
  });
});
