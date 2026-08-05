#!/usr/bin/env node
// Derive real publish/modify dates for the programmatic pages from git history.
//
// WHY THIS EXISTS. The /compare, /solutions, /integrations, /architecture and
// /capabilities pages emit TechArticle JSON-LD. Article types want
// `datePublished` and `dateModified`, and until now those pages shipped
// neither — 110 pages with no freshness or authorship signal, while the
// BlogPosting emitter next door had the full set from frontmatter.
//
// Blog posts carry their own dates because a human wrote them down. These
// pages have no such field, and adding a hand-maintained one would be worse
// than nothing: a stale hand-typed date is a false freshness claim, and there
// is no CI gate that could catch it. Git already records exactly when each
// entry last changed, so that is the source of truth.
//
// Per ENTRY, not per file. The comparison data all lives in one compare.ts, so
// a whole-file date would claim every comparison was revised whenever any one
// of them was. `git log -L <range>:<file>` follows a single entry's line range
// back through history, so /compare/mastra/ gets Mastra's dates and
// /compare/langgraph/ gets LangGraph's.
//
// The result is committed (src/data/page-dates.json) rather than computed
// during the build, for the same reason gh-stats.json is: Cloudflare Pages may
// clone shallow, and a shallow clone would silently produce wrong dates. A
// committed snapshot can only go stale, which understates freshness — the safe
// direction. `--check` keeps it honest in CI.
//
// A path missing from the snapshot makes the emitter omit the date fields
// entirely rather than substitute a guess.
//
//   node scripts/page-dates.mjs           # regenerate the snapshot
//   node scripts/page-dates.mjs --check   # report only, exit 1 when stale

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'src/data/page-dates.json';
const check = process.argv.includes('--check');

/** Commit dates (author date, YYYY-MM-DD) touching a line range, newest first. */
function datesForRange(file, start, end) {
  const out = execFileSync(
    'git',
    ['log', `-L`, `${start},${end}:${file}`, '--format=%as', '-s'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  return out.split('\n').filter((l) => /^\d{4}-\d{2}-\d{2}$/.test(l.trim())).map((l) => l.trim());
}

/** Commit dates for a whole file, newest first. Follows renames. */
function datesForFile(file) {
  const out = execFileSync('git', ['log', '--follow', '--format=%as', '--', file], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split('\n').filter((l) => /^\d{4}-\d{2}-\d{2}$/.test(l.trim())).map((l) => l.trim());
}

function span(dates) {
  if (!dates.length) return null;
  // `git log` yields newest first; published = the oldest commit that touched it.
  return { published: dates[dates.length - 1], modified: dates[0] };
}

/**
 * Slice a data file into per-entry line ranges keyed by slug. Entries are
 * delimited by their own `slug: '...'` lines: an entry runs from just after the
 * previous entry's slug line to just before the next one. That is coarser than
 * matching braces but lands inside the right object, which is all `git log -L`
 * needs to follow the range.
 */
function entryRanges(file) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const hits = [];
  lines.forEach((line, i) => {
    const m = line.match(/^\s{2,4}slug: '([a-z0-9-]+)',$/);
    if (m) hits.push({ slug: m[1], line: i + 1 });
  });
  return hits.map((hit, i) => ({
    slug: hit.slug,
    start: i === 0 ? Math.max(1, hit.line - 1) : hits[i - 1].line + 1,
    end: i === hits.length - 1 ? lines.length : hits[i + 1].line - 1,
  }));
}

const dates = {};

// Entry-driven page families: one data file, many pages.
for (const [file, prefix] of [
  ['src/lib/compare.ts', '/compare/'],
  ['src/lib/solutions.ts', '/solutions/'],
  ['src/lib/integrations.ts', '/integrations/'],
]) {
  for (const { slug, start, end } of entryRanges(file)) {
    const s = span(datesForRange(file, start, end));
    if (s) dates[`${prefix}${slug}/`] = s;
  }
}

// One-off pages whose content lives in their own template.
for (const [file, path] of [
  ['src/pages/[...locale]/compare/claude-dynamic-workflows.astro', '/compare/claude-dynamic-workflows/'],
  ['src/pages/[...locale]/architecture.astro', '/architecture/'],
  ['src/pages/[...locale]/capabilities.astro', '/capabilities/'],
]) {
  const s = span(datesForFile(file));
  if (s) dates[path] = s;
}

// Starlight docs. Starlight's own `lastUpdated` already supplies dateModified,
// but it has no notion of a first-published date, so those pages would emit a
// modified date with nothing to anchor it to. One doc = one file, so the first
// commit touching that file is exactly when the page went live — including for
// the reference docs synced in from the framework repo, where the sync commit
// is genuinely when the page appeared on this site.
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
for (const file of walk('src/content/docs')) {
  if (!/\.mdx?$/.test(file)) continue;
  // src/content/docs/reference/cli.md  ->  /reference/cli/
  // src/content/docs/zh/reference/cli.md -> /zh/reference/cli/
  const route = file.replace(/^src\/content\/docs\//, '').replace(/\.mdx?$/, '');
  const s = span(datesForFile(file));
  if (s) dates[`/${route}/`] = s;
}

const next = JSON.stringify(Object.fromEntries(Object.keys(dates).sort().map((k) => [k, dates[k]])), null, 2) + '\n';

if (check) {
  let current = '';
  try {
    current = readFileSync(OUT, 'utf8');
  } catch {
    console.error(`${OUT} is missing — run: node scripts/page-dates.mjs`);
    process.exit(1);
  }
  if (current !== next) {
    console.error(`${OUT} is stale — run: node scripts/page-dates.mjs`);
    const a = JSON.parse(current);
    const b = JSON.parse(next);
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const x = JSON.stringify(a[k]);
      const y = JSON.stringify(b[k]);
      if (x !== y) console.error(`  ${k}: ${x ?? '(absent)'} -> ${y ?? '(absent)'}`);
    }
    process.exit(1);
  }
  console.log(`page-dates: ${Object.keys(dates).length} paths up to date`);
} else {
  writeFileSync(OUT, next);
  console.log(`page-dates: wrote ${Object.keys(dates).length} paths to ${OUT}`);
}
