// Sync the vendored release notes from the framework's GitHub releases into
// src/content/changelog/. Run on a schedule by .github/workflows/sync-releases.yml
// (which opens a PR with any changes — never auto-merges). Also runnable locally:
//   GITHUB_TOKEN=$(gh auth token) node scripts/sync-releases.mjs
//
// Design:
//   • The GitHub releases — not CHANGELOG.md — are the source. Upstream trims the
//     changelog to the last couple of versions; the releases go back to v1.0.0,
//     and vendoring them makes the site the complete archive.
//   • One file per release, named for its version. Bodies are transformed once
//     (GitHub autolinks + framework doc links) by release-sync-lib.mjs.
//   • Additive by design: a release removed upstream stays vendored here and is
//     reported, never deleted. Drafts are never vendored.
//   • No build-time GitHub fetch — the site only ever reads these committed
//     files (same contract as src/data/gh-stats.json).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CHANGELOG_DIR,
  RELEASES_API,
  compareVersionsDesc,
  isVendorableRelease,
  listVendoredReleases,
  releaseVersion,
  renderReleaseFile,
  vendoredReferenceSlugs,
} from './release-sync-lib.mjs';

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'oma-website-release-sync',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function fetchAllReleases() {
  const releases = [];
  // The framework is ~19 releases deep; the cap keeps a paging bug from looping.
  for (let page = 1; page <= 10; page++) {
    const response = await fetch(`${RELEASES_API}?per_page=100&page=${page}`, { headers });
    if (!response.ok) {
      throw new Error(
        `GitHub releases API returned ${response.status} `
        + `(x-ratelimit-remaining=${response.headers.get('x-ratelimit-remaining') ?? '?'})`,
      );
    }
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('GitHub releases API did not return a list');
    releases.push(...batch);
    if (batch.length < 100) break;
  }
  return releases;
}

async function main() {
  const releases = (await fetchAllReleases()).filter(isVendorableRelease);
  if (releases.length === 0) throw new Error('No published releases found — refusing to write');

  const vendoredReferences = vendoredReferenceSlugs();
  const before = new Set(listVendoredReleases());
  mkdirSync(CHANGELOG_DIR, { recursive: true });

  let added = 0;
  let updated = 0;
  const upstream = new Set();

  for (const release of releases.sort((a, b) => compareVersionsDesc(a.tag_name, b.tag_name))) {
    const version = releaseVersion(release.tag_name);
    upstream.add(version);
    const path = join(CHANGELOG_DIR, `${version}.md`);
    const next = renderReleaseFile(release, vendoredReferences);
    let current = null;
    try {
      current = readFileSync(path, 'utf8');
    } catch { /* new release */ }

    if (current === next) {
      console.log('unchanged', version);
    } else {
      writeFileSync(path, next);
      if (current === null) {
        added++;
        console.log('added    ', version);
      } else {
        updated++;
        console.log('updated  ', version);
      }
    }
  }

  // Kept, not deleted: the archive outlives an upstream release being unpublished.
  const localOnly = [...before].filter((version) => !upstream.has(version));
  if (localOnly.length > 0) {
    console.log(`\nKept ${localOnly.length} release(s) no longer published upstream: ${localOnly.join(', ')}`);
  }

  console.log(
    `\nSynced ${releases.length} release(s) from GitHub: ${added} added, ${updated} updated, `
    + `${releases.length - added - updated} unchanged`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
