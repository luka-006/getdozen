import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const INK = [0x0b, 0x1f, 0x3a, 0xff];
const BLUE = [0x2b, 0x7f, 0xff, 0xff];
const YELLOW = [0xff, 0xc5, 0x3d, 0xff];

const CELLS = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [0, 1],
  [0, 2],
  [0, 3, 1],
  [0, 4],
  [0, 5],
  [5, 1],
  [6, 2],
  [6, 3],
  [5, 4],
  [6, 4],
  [1, 5],
  [2, 5],
  [3, 5],
  [4, 5],
  [5, 5],
];

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    pixels[y].copy(row, 1);
    rows.push(row);
  }
  const idat = deflateSync(Buffer.concat(rows), { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function fillRect(pixels, size, x0, y0, x1, y1, color, radius) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const dx = x < x0 + radius ? x0 + radius - x : x >= x1 - radius ? x - (x1 - radius - 1) : 0;
      const dy = y < y0 + radius ? y0 + radius - y : y >= y1 - radius ? y - (y1 - radius - 1) : 0;
      if (dx * dx + dy * dy > radius * radius + radius) continue;
      pixels[y].writeUInt8(color[0], x * 4);
      pixels[y].writeUInt8(color[1], x * 4 + 1);
      pixels[y].writeUInt8(color[2], x * 4 + 2);
      pixels[y].writeUInt8(color[3], x * 4 + 3);
    }
  }
}

function render(size) {
  const pixels = Array.from({ length: size }, () => Buffer.alloc(size * 4));
  fillRect(pixels, size, 0, 0, size, size, INK, Math.round(size * 0.18));
  const cell = (3.05 / 32) * size;
  const gap = (0.7 / 32) * size;
  const cols = 7;
  const rows = 6;
  const gridW = cols * cell + (cols - 1) * gap;
  const gridH = rows * cell + (rows - 1) * gap;
  const ox = (size - gridW) / 2;
  const oy = (size - gridH) / 2;
  const radius = Math.max(1, (0.72 / 32) * size);
  for (const [c, r, yellow] of CELLS) {
    const x0 = Math.round(ox + c * (cell + gap));
    const y0 = Math.round(oy + r * (cell + gap));
    const x1 = Math.round(x0 + cell);
    const y1 = Math.round(y0 + cell);
    fillRect(pixels, size, x0, y0, x1, y1, yellow ? YELLOW : BLUE, radius);
  }
  return encodePng(size, pixels);
}

function icoFromPngs(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const entries = [];
  const images = [];
  let offset = 6 + 16 * count;
  for (const png of pngs) {
    const size = png.readUInt32BE(16);
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    images.push(png);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...images]);
}

const dir = dirname(fileURLToPath(import.meta.url));
const appDir = join(dir, "..", "src", "app");
const publicDir = join(dir, "..", "public");

const png16 = render(16);
const png32 = render(32);
const png48 = render(48);
const png96 = render(96);
const ico = icoFromPngs([png16, png32, png48]);

writeFileSync(join(appDir, "favicon.ico"), ico);
writeFileSync(join(publicDir, "favicon.ico"), ico);
writeFileSync(join(publicDir, "icon-48.png"), png48);
writeFileSync(join(publicDir, "icon-96.png"), png96);
console.log("wrote favicon.ico, icon-48.png, icon-96.png");
