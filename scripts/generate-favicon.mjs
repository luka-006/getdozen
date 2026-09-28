import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const INK = [0x0b, 0x1f, 0x3a, 0xff];
const BLUE = [0x1e, 0x4f, 0xd8, 0xff];
const YELLOW = [0xff, 0xc5, 0x3d, 0xff];

const VIEW = 32;
const SPINE = { x: 3.5, y: 6, w: 4.5, h: 20, rx: 2.25 };
const ARC = { cx: 14, cy: 16, r: 9, startDeg: -74, endDeg: 74, count: 12, goldenIndex: 9 };
const DOT_R = 1.85;

function arcDots() {
  const dots = [];
  for (let i = 0; i < ARC.count; i++) {
    const t = i / (ARC.count - 1);
    const deg = ARC.startDeg + (ARC.endDeg - ARC.startDeg) * t;
    const rad = (deg * Math.PI) / 180;
    dots.push({
      x: ARC.cx + ARC.r * Math.cos(rad),
      y: ARC.cy + ARC.r * Math.sin(rad),
      yellow: i === ARC.goldenIndex,
    });
  }
  return dots;
}

const DOTS = arcDots();

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
      const dx =
        x < x0 + radius ? x0 + radius - x : x >= x1 - radius ? x - (x1 - radius - 1) : 0;
      const dy =
        y < y0 + radius ? y0 + radius - y : y >= y1 - radius ? y - (y1 - radius - 1) : 0;
      if (dx * dx + dy * dy > radius * radius + radius) continue;
      pixels[y].writeUInt8(color[0], x * 4);
      pixels[y].writeUInt8(color[1], x * 4 + 1);
      pixels[y].writeUInt8(color[2], x * 4 + 2);
      pixels[y].writeUInt8(color[3], x * 4 + 3);
    }
  }
}

function fillCircle(pixels, size, cx, cy, r, color) {
  const x0 = Math.floor(cx - r);
  const x1 = Math.ceil(cx + r);
  const y0 = Math.floor(cy - r);
  const y1 = Math.ceil(cy + r);
  const r2 = r * r;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy > r2) continue;
      pixels[y].writeUInt8(color[0], x * 4);
      pixels[y].writeUInt8(color[1], x * 4 + 1);
      pixels[y].writeUInt8(color[2], x * 4 + 2);
      pixels[y].writeUInt8(color[3], x * 4 + 3);
    }
  }
}

function render(size) {
  const pixels = Array.from({ length: size }, () => Buffer.alloc(size * 4));
  const scale = size / VIEW;
  fillRect(pixels, size, 0, 0, size, size, INK, Math.round(size * 0.18));

  fillRect(
    pixels,
    size,
    Math.round(SPINE.x * scale),
    Math.round(SPINE.y * scale),
    Math.round((SPINE.x + SPINE.w) * scale),
    Math.round((SPINE.y + SPINE.h) * scale),
    BLUE,
    Math.max(1, Math.round(SPINE.rx * scale)),
  );

  for (const dot of DOTS) {
    fillCircle(
      pixels,
      size,
      dot.x * scale,
      dot.y * scale,
      DOT_R * scale,
      dot.yellow ? YELLOW : BLUE,
    );
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
