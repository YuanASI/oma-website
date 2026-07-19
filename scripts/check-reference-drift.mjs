// scripts/check-reference-drift.mjs — READ-ONLY translation-drift detector.
//
// English docs are the source of truth. Their Chinese translations mirror the
// same relative paths under src/content/docs/zh, but an English-only edit can
// silently leave the translated page stale. Reference docs are especially
// exposed because the weekly framework sync refreshes their English bodies.
//
// This flags that. It runs in ordinary CI and in sync-reference.yml AFTER the
// weekly sync (when English bodies already reflect the latest upstream). It
// writes reference-drift-report.md; the sync workflow posts that file as a PR
// comment when it is non-empty. It NEVER mutates docs or the manifest, and
// ALWAYS exits 0 — drift is a signal, not a build failure.
//
// Anchor: scripts/reference-translation-manifest.json records, per doc slug, the
// sha256 of the English body each zh page was translated from (stamped by
// update-translation-manifest.mjs). We re-hash the current English body and
// compare. Same hash → current; different → stale.
import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { extname, join } from 'node:path';

const DOCS_ROOT = 'src/content/docs';
const ZH_ROOT = join(DOCS_ROOT, 'zh');
const SECTIONS = ['getting-started', 'guides', 'reference'];
const MANIFEST = 'scripts/reference-translation-manifest.json';
const REPORT = 'reference-drift-report.md';

// Strip the front-matter — same boundary the sync script preserves
// (sync-reference-docs.mjs), so the hash covers exactly the refreshed body.
const bodyOf = (md) => md.replace(/^---\n[\s\S]*?\n---\n/, '');
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// Recursively list Markdown/MDX paths (nested Reference sections are allowed).
const listDocs = (dir, prefix = '') =>
  !existsSync(dir)
    ? []
    : readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory()
          ? listDocs(join(dir, e.name), `${prefix}${e.name}/`)
          : /\.mdx?$/.test(e.name)
            ? [`${prefix}${e.name}`]
            : [],
      );

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const stale = [];
const untracked = [];

for (const section of SECTIONS) {
  for (const relativePath of listDocs(join(DOCS_ROOT, section))) {
    const sourcePath = join(DOCS_ROOT, section, relativePath);
    const translatedPath = join(ZH_ROOT, section, relativePath);
    if (!existsSync(translatedPath)) continue; // untranslated → Starlight falls back

    const slug = `${section}/${relativePath.slice(0, -extname(relativePath).length)}`;
    const enHash = sha256(bodyOf(readFileSync(sourcePath, 'utf8')));
    const rec = manifest[slug];
    if (!rec) untracked.push(slug); // zh exists, no baseline yet
    else if (rec.enBodySha256 !== enHash) stale.push({ slug, since: rec.translatedAt });
  }
}

let report = '';
if (stale.length || untracked.length) {
  report += '### ⚠️ Translation drift detected\n\n';
  if (stale.length) {
    report += 'These English docs changed since their Chinese translation was last synced — the `zh/` copy is now **stale**:\n\n';
    for (const s of stale) report += `- \`${s.slug}\` — zh last translated ${s.since}\n`;
    report += '\nRe-translate the matching `src/content/docs/zh/…` page, then run `node scripts/update-translation-manifest.mjs <slug>` to clear the flag.\n';
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
