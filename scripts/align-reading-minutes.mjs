#!/usr/bin/env node
// Align `readingMinutes` across blog posts.
//
// Posts migrated from dev.to carry the value dev.to computed
// (scripts/migrate-devto-blog.mjs copies `reading_time_minutes`), and that
// value is authoritative: changing it would disagree with the article still
// published there. Hand-written posts had no such source and drifted — several
// were estimated at roughly half the site's own reading rate.
//
// So: leave dev.to posts alone, and derive every other post from the constant
// those posts imply. Counting whitespace-separated tokens over the whole body
// including code fences, `round(words / 244)` reproduces all eight dev.to
// values exactly (the fit holds for any divisor in 241–246; 244 sits in the
// middle of that range).
//
// zh posts mirror their en counterpart rather than being measured separately.
// A Chinese translation has no comparable word count, and a reader switching
// locales should not see the same article advertise two different times.
//
//   node scripts/align-reading-minutes.mjs           # rewrite drifted values
//   node scripts/align-reading-minutes.mjs --check   # report only, exit 1 on drift

import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const EN_DIR = 'src/content/blog';
const ZH_DIR = 'src/content/blog/zh';
const WORDS_PER_MINUTE = 244;

const check = process.argv.includes('--check');

/** Split a post into [frontmatter, body]; throws when the fences are missing. */
function splitPost(path) {
  const raw = readFileSync(path, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${path}: no frontmatter block`);
  return { raw, frontmatter: match[1], body: match[2] };
}

function readingMinutesOf(frontmatter, path) {
  const match = frontmatter.match(/^readingMinutes: (\d+)$/m);
  if (!match) throw new Error(`${path}: no readingMinutes field`);
  return Number(match[1]);
}

/** dev.to counts the whole body, code fences included. */
function estimate(body) {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE));
}

function setReadingMinutes(raw, minutes) {
  return raw.replace(/^readingMinutes: \d+$/m, `readingMinutes: ${minutes}`);
}

const drifted = [];
const slugs = readdirSync(EN_DIR).filter((name) => name.endsWith('.md'));

for (const slug of slugs) {
  const enPath = join(EN_DIR, slug);
  const en = splitPost(enPath);
  const current = readingMinutesOf(en.frontmatter, enPath);

  // dev.to owns the value for posts it published.
  const target = /^devtoUrl: /m.test(en.frontmatter) ? current : estimate(en.body);

  if (current !== target) {
    drifted.push({ path: enPath, from: current, to: target });
    if (!check) writeFileSync(enPath, setReadingMinutes(en.raw, target));
  }

  // Mirror onto the translation when one exists.
  const zhPath = join(ZH_DIR, slug);
  let zh;
  try {
    zh = splitPost(zhPath);
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  const zhCurrent = readingMinutesOf(zh.frontmatter, zhPath);
  if (zhCurrent !== target) {
    drifted.push({ path: zhPath, from: zhCurrent, to: target });
    if (!check) writeFileSync(zhPath, setReadingMinutes(zh.raw, target));
  }
}

if (drifted.length === 0) {
  console.log(`readingMinutes aligned across ${slugs.length} posts and their translations.`);
  process.exit(0);
}

for (const { path, from, to } of drifted) {
  console.log(`  ${check ? 'drift' : 'fixed'}  ${path}: ${from} -> ${to}`);
}

if (check) {
  console.error(`\n${drifted.length} post(s) drifted. Run: node scripts/align-reading-minutes.mjs`);
  process.exit(1);
}
console.log(`\nUpdated ${drifted.length} file(s).`);
