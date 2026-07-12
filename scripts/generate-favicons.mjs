// Generate the raster favicon set from public/favicon.svg.
//
// Why this exists: Google Search only shows a site's favicon in results when it
// can fetch a square raster icon of at least 48x48 — and it falls back to
// /favicon.ico when the HTML doesn't declare one it can use. The site used to
// ship an SVG-only favicon with no /favicon.ico (404), so Google rendered the
// generic globe instead of our mark. This script rasterizes the SVG into the
// icons Google + browsers reliably pick up. Re-run it whenever favicon.svg
// changes: `node scripts/generate-favicons.mjs`.
//
// Outputs (all committed to public/, served from the site root):
//   favicon.ico            multi-size ICO (16/32/48) — Google's root fallback + legacy
//   favicon-96x96.png      PNG icon Google explicitly supports
//   apple-touch-icon.png   180x180 — iOS home screen / Safari
//   icon-192.png           192x192 — Android / PWA
//
// Runs on `sharp` (already a dependency). The SVG is self-contained (solid brand
// fills, no currentColor / external refs), so librsvg rasterizes it faithfully.
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcSvg = readFileSync(join(root, 'public', 'favicon.svg'));
const out = (name) => join(root, 'public', name);

// Rasterize the 32-unit-viewBox SVG at a target pixel size. High density
// supersamples from the vector before the final resize so small icons stay
// crisp. Transparent canvas — the mark carries its own filled background.
async function png(size) {
  return sharp(srcSvg, { density: Math.ceil((96 * size) / 32) * 2 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// Pack PNG buffers into a single ICO (PNG-embedded, the modern form every
// current browser + Google understand). Layout: 6-byte ICONDIR, then one
// 16-byte ICONDIRENTRY per image, then the PNG payloads.
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(images.length, 4); // image count

  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, buffer }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 => 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 => 256)
    e.writeUInt8(0, 2); // palette color count (0 => truecolor)
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // color planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(buffer.length, 8); // bytes of PNG payload
    e.writeUInt32LE(offset, 12); // payload offset from file start
    offset += buffer.length;
    return e;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.buffer)]);
}

const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(
  icoSizes.map(async (size) => ({ size, buffer: await png(size) })),
);
writeFileSync(out('favicon.ico'), buildIco(icoImages));
writeFileSync(out('favicon-96x96.png'), await png(96));
writeFileSync(out('apple-touch-icon.png'), await png(180));
writeFileSync(out('icon-192.png'), await png(192));

console.log('Wrote public/{favicon.ico, favicon-96x96.png, apple-touch-icon.png, icon-192.png}');
