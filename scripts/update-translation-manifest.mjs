// scripts/update-translation-manifest.mjs — stamp the translation baseline for
// one or more documentation slugs.
//
//   node scripts/update-translation-manifest.mjs getting-started/quick-start reference/cli
//
// Records the sha256 of each slug's CURRENT English body into
// scripts/reference-translation-manifest.json with today's date. Run it after
// translating (or re-translating) a reference page so check-reference-drift.mjs
// treats the zh copy as current. See TRANSLATING.md.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const DOCS_ROOT = 'src/content/docs';
const SECTIONS = new Set(['getting-started', 'guides', 'reference']);
const MANIFEST = 'scripts/reference-translation-manifest.json';

// Must match check-reference-drift.mjs / sync-reference-docs.mjs.
const bodyOf = (md) => md.replace(/^---\n[\s\S]*?\n---\n/, '');
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error('usage: node scripts/update-translation-manifest.mjs <section>/<slug> [<section>/<slug> ...]');
  process.exit(1);
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const today = new Date().toISOString().slice(0, 10);

let stamped = 0;
for (const slug of slugs) {
  const [section] = slug.split('/');
  if (!SECTIONS.has(section)) {
    console.error('skip (unsupported section):', slug);
    continue;
  }

  const mdPath = join(DOCS_ROOT, `${slug}.md`);
  const mdxPath = join(DOCS_ROOT, `${slug}.mdx`);
  const enPath = existsSync(mdPath) ? mdPath : existsSync(mdxPath) ? mdxPath : null;
  if (!enPath) { console.error('skip (no English source):', slug); continue; }

  manifest[slug] = {
    enBodySha256: sha256(bodyOf(readFileSync(enPath, 'utf8'))),
    translatedAt: today,
  };
  console.log('stamped', slug);
  stamped++;
}

// Stable key order for clean diffs (keeps the leading `_comment` at the top).
const ordered = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
writeFileSync(MANIFEST, JSON.stringify(ordered, null, 2) + '\n');
console.log(`${stamped} slug(s) stamped → ${MANIFEST}`);
