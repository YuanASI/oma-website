// Fails when the site states a framework version that is not the current one.
//
// The failure this exists to prevent: /capabilities pinned v1.13.0 in four
// dictionary strings, a nav menu description, and a hand-written release-notes
// tag URL. The v1.14.0 release shipped, sync-releases vendored its notes, the
// GitHub-stats cron moved the landing hero to v1.14.0 — and /capabilities stayed
// on v1.13.0, contradicting /changelog and the landing page on the same site.
//
// Nothing in that chain was broken; the version simply was not derived from
// anything. src/lib/release.ts derives it now, and this gate keeps it that way.
//
// Two checks:
//   1. Version literals in copy and page templates must be the current release
//      (or an allowlisted historical fact). Copy should interpolate a ReleaseRef
//      instead — a literal that matches today is still a literal that will not
//      move on its own, but it is at least loud when it goes stale.
//   2. The site's two version sources must agree: src/data/gh-stats.json
//      (refreshed by refresh-gh-data.yml, feeds the landing stat tile) and the
//      changelog collection (written by sync-releases.yml, feeds everything
//      else). One job running without the other shows two versions on one site.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CHANGELOG_DIR = 'src/content/changelog';
const GH_STATS = 'src/data/gh-stats.json';

// A stale literal here breaks a reader-visible claim, so it fails the build.
const ENFORCED = [
  'src/i18n',
  'src/lib/site.ts',
  'src/pages',
  'src/components',
  'src/layouts',
];

// Reported, never fatal. These carry version numbers that are assertions about
// upstream state — "verified against core vX", "compatible with core vX" — and
// the fix is to re-verify against the framework, not to edit the number. A
// hard failure here would only teach whoever hits it to bump the digits.
const ADVISORY = [
  'src/lib/compare.ts',
  'src/lib/integrations.ts',
];

// Versions that are correct precisely because they are not the current release.
// Every entry states why, and an unexplained addition should not pass review.
const ALLOWLIST = new Map([
  ['1.11.0', 'the release that introduced TraceRecord v2 — a historical fact, not a current-version claim'],
]);

// Only the framework's own major line is checked. Competitor versions are all
// over the comparison data (AutoGen v0.2 and v0.4, and whatever ships next), and
// a gate that flagged those would be muted within a week. @open-multi-agent/otel
// is likewise on its own 0.x line and is not core's version to track.
const isOwnLine = (version, current) =>
  version.split('.')[0] === current.version.split('.')[0];

// Comment text is not reader-visible, so a stale version in one misleads the next
// maintainer rather than the audience — reported, never fatal. The check is the
// line's leading token, which fits this codebase (`//` throughout, `*` inside the
// occasional block); a trailing comment after code is treated as code.
const isComment = (line) => /^\s*(\/\/|\*|\/\*|<!--)/.test(line);

// Whether a line is talking about OMA at all. Applied only in advisory files,
// where a version number is as likely to belong to a competitor as to core.
const namesOwnPackage = (line) => /\bcore\b|open-multi-agent|\bOMA\b/i.test(line);

const SOURCE_EXT = /\.(ts|astro|mjs)$/;

function listFiles(target) {
  try {
    const entries = readdirSync(target, { recursive: true, withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && SOURCE_EXT.test(e.name))
      .map((e) => join(e.parentPath ?? e.path, e.name));
  } catch (error) {
    if (error.code === 'ENOTDIR') return [target];
    throw error;
  }
}

// Newest first: published date decides, version breaks a same-day tie — the same
// rule /changelog and src/lib/release.ts use.
function compareVersions(a, b) {
  const parts = (v) => v.split(/[.-]/).map((n) => Number.parseInt(n, 10) || 0);
  const [left, right] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (right[i] ?? 0) - (left[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function readFrontMatter(file) {
  const raw = readFileSync(join(CHANGELOG_DIR, file), 'utf8');
  const block = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!block) throw new Error(`${file} has no front matter`);
  const field = (name) => block[1].match(new RegExp(`^${name}:\\s*['"]?([^'"\\n]+)`, 'm'))?.[1]?.trim();
  return {
    version: field('version'),
    tag: field('tag'),
    prerelease: field('prerelease') === 'true',
  };
}

function currentRelease() {
  const entries = readdirSync(CHANGELOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .map(readFrontMatter)
    .filter((e) => e.version && !e.prerelease);
  if (entries.length === 0) throw new Error(`No published releases found in ${CHANGELOG_DIR}`);
  return entries.sort((a, b) => compareVersions(a.version, b.version))[0];
}

// Version literals as they appear in prose and markup: a `v`-prefixed number, or
// one following a package name. SVG path data is stripped first — a path command
// like `v1.15` is a vertical line, and both Nav.astro and LangSwitcher.astro
// contain one. Bare numbers are not matched: `1.15.46` inside path data is
// indistinguishable from a version, and false alarms would get this gate muted.
const VERSION_PATTERN = /(?:^|[\s(·@])v(\d+\.\d+(?:\.\d+)?)|@(\d+\.\d+\.\d+)/g;

function findLiterals(file, current, { requireOwnPackage = false } = {}) {
  const lines = readFileSync(file, 'utf8')
    .replace(/\sd="[^"]*"/g, ' d=""')
    .split('\n');
  const hits = [];
  lines.forEach((line, i) => {
    for (const match of line.matchAll(VERSION_PATTERN)) {
      const version = match[1] ?? match[2];
      // A two-part literal (v1.14) names the release line, not a patch.
      const isCurrent = version === current.version
        || version === current.version.split('.').slice(0, 2).join('.');
      if (isCurrent || ALLOWLIST.has(version) || !isOwnLine(version, current)) continue;
      if (requireOwnPackage && !namesOwnPackage(line)) continue;
      hits.push({ file, line: i + 1, version, comment: isComment(line), text: line.trim() });
    }
  });
  return hits;
}

const current = currentRelease();
const enforced = ENFORCED.flatMap(listFiles).flatMap((f) => findLiterals(f, current));
const failures = enforced.filter((hit) => !hit.comment);
const advisories = [
  ...enforced.filter((hit) => hit.comment),
  ...ADVISORY.flatMap(listFiles).flatMap((f) => findLiterals(f, current, { requireOwnPackage: true })),
];

// The two refresh jobs must not disagree about what the newest release is.
const snapshot = JSON.parse(readFileSync(GH_STATS, 'utf8')).latestRelease;
const sourcesAgree = snapshot === current.tag;

if (advisories.length) {
  console.warn(`\nVersion claims to re-verify against ${current.tag} (advisory, not a failure):`);
  for (const hit of advisories) {
    console.warn(`  ${hit.file}:${hit.line} — v${hit.version}${hit.comment ? ' (comment)' : ''}`);
  }
  console.warn('  Each asserts upstream state or records the baseline something was checked');
  console.warn('  against. Re-verify against the framework, then update the text — renumbering');
  console.warn('  a verification record without redoing the verification forges it.\n');
}

if (!sourcesAgree) {
  console.error(
    `Version sources disagree: ${GH_STATS} says ${snapshot}, newest changelog entry is ${current.tag}.\n` +
      '  One of refresh-gh-data.yml / sync-releases.yml has run without the other.',
  );
}

if (failures.length) {
  console.error(`\nStale version literals (current release is ${current.tag}):`);
  for (const hit of failures) {
    console.error(`  ${hit.file}:${hit.line} — v${hit.version}`);
    console.error(`    ${hit.text.slice(0, 120)}`);
  }
  console.error('\n  Copy should interpolate a ReleaseRef from src/lib/release.ts rather than');
  console.error('  naming a version. Copy describing what one release introduced should not name');
  console.error('  a version at all — renumbering it would re-date the claim without checking it.');
}

if (failures.length || !sourcesAgree) {
  process.exitCode = 1;
} else {
  console.log(`Version references are consistent with ${current.tag}.`);
}
