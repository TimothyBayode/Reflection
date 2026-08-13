import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const SIZE = 1024;
const SCALE = 4;
const W = SIZE * SCALE;
const pixels = new Uint8Array(W * W * 4);

const colors = {
  body: [228, 87, 78, 255],
  glow: [255, 240, 223, 255],
  visor: [55, 38, 43, 255],
};

function blendPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= W || y >= W) return;
  const i = (y * W + x) * 4;
  const alpha = color[3] / 255;
  const inverse = 1 - alpha;
  pixels[i] = Math.round(color[0] * alpha + pixels[i] * inverse);
  pixels[i + 1] = Math.round(color[1] * alpha + pixels[i + 1] * inverse);
  pixels[i + 2] = Math.round(color[2] * alpha + pixels[i + 2] * inverse);
  pixels[i + 3] = Math.round((alpha + (pixels[i + 3] / 255) * inverse) * 255);
}

function roundedRect(x, y, width, height, radius, fill, stroke, strokeWidth) {
  const left = x * SCALE;
  const top = y * SCALE;
  const right = (x + width) * SCALE;
  const bottom = (y + height) * SCALE;
  const outerRadius = radius * SCALE;
  const innerInset = strokeWidth * SCALE;

  for (let py = Math.floor(top); py < Math.ceil(bottom); py++) {
    for (let px = Math.floor(left); px < Math.ceil(right); px++) {
      const dx = Math.max(left + outerRadius - px, 0, px - (right - outerRadius));
      const dy = Math.max(top + outerRadius - py, 0, py - (bottom - outerRadius));
      if (dx * dx + dy * dy > outerRadius * outerRadius) continue;

      const innerLeft = left + innerInset;
      const innerTop = top + innerInset;
      const innerRight = right - innerInset;
      const innerBottom = bottom - innerInset;
      const innerRadius = Math.max(0, outerRadius - innerInset);
      const idx = Math.max(innerLeft + innerRadius - px, 0, px - (innerRight - innerRadius));
      const idy = Math.max(innerTop + innerRadius - py, 0, py - (innerBottom - innerRadius));
      const insideInner = px >= innerLeft && px <= innerRight && py >= innerTop && py <= innerBottom && idx * idx + idy * idy <= innerRadius * innerRadius;
      blendPixel(px, py, insideInner ? fill : stroke);
    }
  }
}

function circle(cx, cy, radius, fill, stroke, strokeWidth) {
  const x0 = (cx - radius - strokeWidth) * SCALE;
  const y0 = (cy - radius - strokeWidth) * SCALE;
  const x1 = (cx + radius + strokeWidth) * SCALE;
  const y1 = (cy + radius + strokeWidth) * SCALE;
  const inner = Math.max(0, radius - strokeWidth) * SCALE;
  const outer = radius * SCALE;
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      const distance = Math.hypot(x - cx * SCALE, y - cy * SCALE);
      if (distance <= inner) blendPixel(x, y, fill);
      else if (distance <= outer) blendPixel(x, y, stroke);
    }
  }
}

// Same proportions and colors used by Player.draw, enlarged for branding.
roundedRect(292, 132, 440, 760, 118, colors.body, colors.glow, 28);
circle(625, 390, 82, colors.visor, colors.glow, 18);

// Downsample the supersampled image for smooth transparent edges.
const output = new Uint8Array(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const sums = [0, 0, 0, 0];
    for (let sy = 0; sy < SCALE; sy++) {
      for (let sx = 0; sx < SCALE; sx++) {
        const source = (((y * SCALE + sy) * W) + x * SCALE + sx) * 4;
        for (let channel = 0; channel < 4; channel++) sums[channel] += pixels[source + channel];
      }
    }
    const target = (y * SIZE + x) * 4;
    for (let channel = 0; channel < 4; channel++) output[target + channel] = Math.round(sums[channel] / (SCALE * SCALE));
  }
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

const scanlines = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  const row = y * (SIZE * 4 + 1);
  scanlines[row] = 0;
  scanlines.set(output.subarray(y * SIZE * 4, (y + 1) * SIZE * 4), row + 1);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(SIZE, 0);
header.writeUInt32BE(SIZE, 4);
header[8] = 8;
header[9] = 6;

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", header),
  chunk("IDAT", deflateSync(scanlines, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

writeFileSync(new URL("../public/player-avatar.png", import.meta.url), png);
console.log(`Generated public/player-avatar.png (${png.length} bytes, ${SIZE}x${SIZE})`);
