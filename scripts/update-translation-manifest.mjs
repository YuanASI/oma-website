// scripts/update-translation-manifest.mjs — stamp the translation baseline for
// one or more Reference slugs.
//
//   node scripts/update-translation-manifest.mjs reference/cli [reference/providers ...]
//
// Records the sha256 of each slug's CURRENT English body into
// scripts/reference-translation-manifest.json with today's date. Run it after
// translating (or re-translating) a reference page so check-reference-drift.mjs
// treats the zh copy as current. See TRANSLATING.md.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const REFDIR = 'src/content/docs/reference';
const MANIFEST = 'scripts/reference-translation-manifest.json';

// Must match check-reference-drift.mjs / sync-reference-docs.mjs.
const bodyOf = (md) => md.replace(/^---\n[\s\S]*?\n---\n/, '');
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error('usage: node scripts/update-translation-manifest.mjs reference/<slug> [reference/<slug> ...]');
  process.exit(1);
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const today = new Date().toISOString().slice(0, 10);

let stamped = 0;
for (const slug of slugs) {
  const name = slug.replace(/^reference\//, '');
  const enPath = join(REFDIR, `${name}.md`);
  if (!existsSync(enPath)) { console.error('skip (no English source):', slug); continue; }
  manifest[`reference/${name}`] = {
    enBodySha256: sha256(bodyOf(readFileSync(enPath, 'utf8'))),
    translatedAt: today,
  };
  console.log('stamped', `reference/${name}`);
  stamped++;
}

// Stable key order for clean diffs (keeps the leading `_comment` at the top).
const ordered = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
writeFileSync(MANIFEST, JSON.stringify(ordered, null, 2) + '\n');
console.log(`${stamped} slug(s) stamped → ${MANIFEST}`);
