// scripts/check-reference-drift.mjs — READ-ONLY translation-drift detector.
//
// The Reference docs (src/content/docs/reference) are vendored from the
// framework repo and re-synced weekly by sync-reference-docs.mjs, which
// refreshes each English body in place. Their Chinese translations live in
// src/content/docs/zh/reference and are NOT touched by that sync (the PR's
// add-paths is scoped to the English tree) — so when an English body moves, the
// zh copy silently goes stale and may render wrong information.
//
// This flags that. It runs in .github/workflows/sync-reference.yml AFTER the
// sync (English bodies already reflect the latest upstream) and writes
// reference-drift-report.md; the workflow posts that file as a PR comment when
// it is non-empty. It NEVER mutates docs or the manifest, and ALWAYS exits 0 —
// drift is a signal, not a build failure.
//
// Anchor: scripts/reference-translation-manifest.json records, per slug, the
// sha256 of the English body each zh page was translated from (stamped by
// update-translation-manifest.mjs). We re-hash the current English body and
// compare. Same hash → current; different → stale.
import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const REFDIR = 'src/content/docs/reference';
const ZHDIR = 'src/content/docs/zh/reference';
const MANIFEST = 'scripts/reference-translation-manifest.json';
const REPORT = 'reference-drift-report.md';

// Strip the front-matter — same boundary the sync script preserves
// (sync-reference-docs.mjs), so the hash covers exactly the refreshed body.
const bodyOf = (md) => md.replace(/^---\n[\s\S]*?\n---\n/, '');
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// Recursively list reference slugs from the English tree (handles providers/…).
const listSlugs = (dir, prefix = '') =>
  !existsSync(dir)
    ? []
    : readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory()
          ? listSlugs(join(dir, e.name), `${prefix}${e.name}/`)
          : e.name.endsWith('.md')
            ? [`${prefix}${e.name.replace(/\.md$/, '')}`]
            : [],
      );

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const stale = [];
const untracked = [];

for (const name of listSlugs(REFDIR)) {
  const slug = `reference/${name}`;
  if (!existsSync(join(ZHDIR, `${name}.md`))) continue; // not translated → silent (Starlight falls back)
  const enHash = sha256(bodyOf(readFileSync(join(REFDIR, `${name}.md`), 'utf8')));
  const rec = manifest[slug];
  if (!rec) untracked.push(slug);                       // zh exists, no baseline yet
  else if (rec.enBodySha256 !== enHash) stale.push({ slug, since: rec.translatedAt });
}

let report = '';
if (stale.length || untracked.length) {
  report += '### ⚠️ Translation drift detected\n\n';
  if (stale.length) {
    report += 'These English Reference pages changed since their Chinese translation was last synced — the `zh/` copy is now **stale**:\n\n';
    for (const s of stale) report += `- \`${s.slug}\` — zh last translated ${s.since}\n`;
    report += '\nRe-translate the matching `src/content/docs/zh/reference/…` page, then run `node scripts/update-translation-manifest.mjs <slug>` to clear the flag.\n';
  }
  if (untracked.length) {
    if (stale.length) report += '\n';
    report += 'These have a `zh/` translation but **no manifest baseline** — run `node scripts/update-translation-manifest.mjs <slug>` once to start tracking:\n\n';
    for (const s of untracked) report += `- \`${s}\`\n`;
  }
}

writeFileSync(REPORT, report);
console.log(report || 'No translation drift.');
// Always succeed — drift must never red-fail the weekly sync PR.
