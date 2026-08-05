#!/usr/bin/env node
// Fail the build when a page ships a SERP title or meta description that Google
// will truncate.
//
// This runs against dist/, not the source, because titles and descriptions are
// assembled from several places — an i18n dict, a data file, a template suffix,
// blog frontmatter — and only the built HTML shows what actually reaches a
// crawler. An audit found 44 over-long titles and 64 over-long descriptions
// that every source-level review had missed for exactly that reason.
//
// Budgets are rendered width, not character count (see src/lib/seo.ts): CJK
// glyphs count double, because that is how Google's pixel-width truncation
// treats them.
//
//   node scripts/check-meta-lengths.mjs            # fail on any violation
//   node scripts/check-meta-lengths.mjs --report   # list everything, exit 0

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const TITLE_MAX = 60;
const DESC_MAX = 160;
// Descriptions this short usually mean a missing or placeholder value rather
// than deliberate brevity. Warn-only: some pages are legitimately terse.
const DESC_MIN = 70;

const report = process.argv.includes('--report');

function width(text) {
  let w = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0) ?? 0;
    const wide =
      (c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2e80 && c <= 0xa4cf) ||
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe4f) ||
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6) ||
      (c >= 0x20000 && c <= 0x3fffd);
    w += wide ? 2 : 1;
  }
  return w;
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function decode(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

let pages = 0;
const longTitles = [];
const longDescs = [];
const shortDescs = [];
const missing = [];

for (const file of walk(DIST)) {
  if (!file.endsWith('.html')) continue;
  const html = readFileSync(file, 'utf8');
  // Redirect stubs and Pagefind fragments carry no SERP surface of their own.
  if (/<meta http-equiv="refresh"/i.test(html)) continue;
  const url = '/' + relative(DIST, file).replace(/index\.html$/, '');
  pages++;

  const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ?? [, ''])[1].trim());
  const descMatch =
    html.match(/<meta\s+name="description"\s+content="([\s\S]*?)"\s*\/?>/i) ??
    html.match(/<meta\s+content="([\s\S]*?)"\s+name="description"\s*\/?>/i);
  const desc = decode((descMatch ?? [, ''])[1].trim());

  if (!title) missing.push([url, 'title']);
  if (!desc) missing.push([url, 'description']);
  if (title && width(title) > TITLE_MAX) longTitles.push([width(title), url, title]);
  if (desc && width(desc) > DESC_MAX) longDescs.push([width(desc), url, desc]);
  if (desc && width(desc) < DESC_MIN) shortDescs.push([width(desc), url, desc]);
}

const show = (label, rows, max) => {
  if (!rows.length) return;
  console.error(`\n${label} (${rows.length}, budget ${max}):`);
  for (const [w, url, text] of rows.sort((a, b) => b[0] - a[0])) {
    console.error(`  ${String(w).padStart(3)}  ${url}`);
    console.error(`       ${text.slice(0, 110)}${text.length > 110 ? '…' : ''}`);
  }
};

show('Titles over budget', longTitles, TITLE_MAX);
show('Descriptions over budget', longDescs, DESC_MAX);
if (missing.length) {
  console.error(`\nMissing metadata (${missing.length}):`);
  for (const [url, what] of missing) console.error(`  ${url} — no ${what}`);
}
if (shortDescs.length) {
  console.warn(`\nShort descriptions (${shortDescs.length}, under ${DESC_MIN} — warning only):`);
  for (const [w, url] of shortDescs.sort((a, b) => a[0] - b[0])) {
    console.warn(`  ${String(w).padStart(3)}  ${url}`);
  }
}

const failures = longTitles.length + longDescs.length + missing.length;
if (report) {
  console.log(`\nmeta-lengths: scanned ${pages} pages — ${failures} over budget, ${shortDescs.length} short.`);
  process.exit(0);
}
if (failures) {
  console.error(`\nmeta-lengths: ${failures} violation(s) across ${pages} pages.`);
  process.exit(1);
}
console.log(`meta-lengths: ${pages} pages within budget (title ≤ ${TITLE_MAX}, description ≤ ${DESC_MAX}).`);
