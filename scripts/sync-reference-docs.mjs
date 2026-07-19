// Sync the vendored Reference docs from the framework repo's `main` branch into
// src/content/docs/reference/. Run on a schedule by
// .github/workflows/sync-reference.yml (which opens a PR with any changes —
// never auto-merges; the build CI + a human review gate it). Also runnable
// locally:  node scripts/sync-reference-docs.mjs
//
// Design (PRD §4.2 / §7 — prevent the docs drifting from the framework):
//   • Tracks `main` (latest), not a pinned tag.
//   • Each vendored file's Starlight front-matter (title + the hand-written
//     description) is CURATED and PRESERVED; only the body is refreshed.
//   • The upstream `# H1` is dropped (Starlight renders the title from
//     front-matter), and framework-relative links are rewritten to forms that
//     resolve on the site.
//   • The upstream file list is discovered. Explicitly excluded docs remain on
//     GitHub; every other new doc or directory fails a visible integration gate.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BRANCH,
  EXCLUDE,
  REPO,
  REFDIR,
  RAW,
  classifyUpstreamEntries,
  discoveryHasBlockers,
  formatDiscoveryGate,
  frontmatterOf,
  listLocalFlatReferences,
  transformUpstreamBody,
} from './reference-sync-lib.mjs';

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const apiHeaders = token
  ? { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
  : { Accept: 'application/vnd.github+json' };

function frontmatter(file) {
  return frontmatterOf(readFileSync(join(REFDIR, `${file}.md`), 'utf8'), `${file}.md`);
}

async function main() {
  const listing = await fetch(`https://api.github.com/repos/${REPO}/contents/docs?ref=${BRANCH}`, { headers: apiHeaders });
  if (!listing.ok) throw new Error(`GitHub contents API returned ${listing.status}`);
  const entries = await listing.json();
  if (!Array.isArray(entries)) throw new Error('GitHub contents API did not return a directory listing');

  const classification = classifyUpstreamEntries(entries, listLocalFlatReferences(REFDIR), EXCLUDE);
  if (discoveryHasBlockers(classification)) {
    console.error(formatDiscoveryGate(classification));
    process.exitCode = 1;
    return;
  }

  const vendored = new Set(classification.vendored);
  let changed = 0;
  let failed = 0;
  for (const file of classification.vendored) {
    const path = join(REFDIR, `${file}.md`);
    const response = await fetch(RAW(`docs/${file}.md`));
    if (!response.ok) {
      console.error('FAIL fetch', file, response.status);
      failed++;
      continue;
    }
    const body = transformUpstreamBody(await response.text(), vendored);
    const next = `${frontmatter(file)}\n${body}`;
    if (next !== readFileSync(path, 'utf8')) {
      writeFileSync(path, next);
      changed++;
      console.log('updated', file);
    } else {
      console.log('unchanged', file);
    }
  }

  console.log(`\n${changed} file(s) changed, ${failed} fetch failure(s)`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Reference sync failed: ${error.message}`);
  process.exitCode = 1;
});
