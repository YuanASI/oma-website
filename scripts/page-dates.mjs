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

/**
 * A shallow clone has exactly one commit, so every `git log` here would report
 * today for every page. Generating from that would overwrite real dates with a
 * uniform build-date stamp — the precise failure this snapshot exists to
 * prevent — and checking against it would fail on a difference that says
 * nothing about the source. So: refuse to write, and skip the check.
 *
 * CI passes fetch-depth: 0 so the check runs for real there. Cloudflare Pages
 * clones shallow and only builds, never regenerates, so it is unaffected.
 */
function isShallow() {
  try {
    return execFileSync('git', ['rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim() === 'true';
  } catch {
    return false;
  }
}

if (isShallow()) {
  const msg = 'page-dates: shallow clone — git history is not available.';
  if (check) {
    console.log(`${msg} Skipping (nothing to verify against).`);
    process.exit(0);
  }
  console.error(`${msg} Refusing to regenerate: every page would be stamped with today's date.`);
  console.error('Run `git fetch --unshallow` first.');
  process.exit(1);
}

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

  // What this gate is actually for: making sure the site never claims a page is
  // fresher, or older, than git says. It deliberately does NOT demand byte
  // equality with a freshly generated snapshot.
  //
  // It cannot. Regenerating reads committed history, so a commit that edits
  // compare.ts moves those pages' dateModified to that commit's date — a date
  // that did not exist when the snapshot was written moments earlier, in the
  // same commit. A byte-equality gate is therefore unsatisfiable immediately
  // after any content change, which would train everyone to bypass it.
  //
  // So: a snapshot lagging behind git is fine. It under-claims freshness, which
  // is the safe direction, and gets picked up by the next regeneration. What
  // fails the build is a snapshot that OVERSTATES — a modified date newer than
  // any commit, a published date earlier than the first commit, or a path with
  // no git history at all. Those are the fabrications worth blocking.
  const snapshot = JSON.parse(current);
  const errors = [];
  const behind = [];

  for (const [path, got] of Object.entries(snapshot)) {
    const real = dates[path];
    if (!real) {
      errors.push(`${path}: in the snapshot but has no git history — stale path or hand-written entry`);
      continue;
    }
    if (got.modified > real.modified) {
      errors.push(`${path}: modified ${got.modified} is newer than the last commit (${real.modified})`);
    }
    if (got.published < real.published) {
      errors.push(`${path}: published ${got.published} predates the first commit (${real.published})`);
    }
    if (got.modified < real.modified || got.published > real.published) {
      behind.push(`${path}: ${got.published}..${got.modified} -> ${real.published}..${real.modified}`);
    }
  }
  const missing = Object.keys(dates).filter((p) => !(p in snapshot));

  if (errors.length) {
    console.error(`${OUT} claims dates git does not support:`);
    for (const e of errors) console.error(`  ${e}`);
    console.error('\nRun: node scripts/page-dates.mjs');
    process.exit(1);
  }
  if (missing.length) {
    console.warn(`page-dates: ${missing.length} page(s) absent from the snapshot (they will emit no dates):`);
    for (const p of missing.slice(0, 10)) console.warn(`  ${p}`);
    console.warn('Run `pnpm gen:page-dates` to include them.');
  }
  if (behind.length) {
    console.warn(`page-dates: ${behind.length} entr(y/ies) behind git — safe, but refresh when convenient:`);
    for (const b of behind.slice(0, 10)) console.warn(`  ${b}`);
    console.warn('Run `pnpm gen:page-dates`.');
  }
  console.log(`page-dates: ${Object.keys(snapshot).length} paths verified against git history`);
} else {
  writeFileSync(OUT, next);
  console.log(`page-dates: wrote ${Object.keys(dates).length} paths to ${OUT}`);
}
