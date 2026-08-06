// The published-release facts that version-bearing copy interpolates.
//
// One source: the `changelog` collection (src/content/changelog/*.md), vendored
// from the framework's GitHub releases by scripts/sync-releases.mjs. That is the
// same source /changelog renders, so a version shown anywhere on the site and
// the release history can never disagree.
//
// Why not src/data/gh-stats.json — it carries `latestRelease` too, and the
// landing hero uses it for the stat tile. But the changelog entry additionally
// carries the release URL and date, and it is the collection the release-notes
// link has to agree with. Two refresh jobs write the two files (refresh-gh-data
// vs sync-releases), so pinning version-bearing copy to one of them keeps a
// mid-refresh window from showing two different versions on one page.
//
// scripts/check-version-drift.mjs enforces that no dictionary or page re-pins a
// version literal instead of interpolating one of these.
import { getCollection } from 'astro:content';
// The shape lives in the dictionary, not here: it is the contract the copy
// declares and this module fulfills. Keeping it there also keeps it reachable
// from tsconfig.i18n.json, whose `include` is src/i18n only — importing the
// other direction would drag `astro:content` into that narrow gate's program.
import type { ReleaseRef } from '../i18n/en';

export type { ReleaseRef };

export interface LatestRelease extends ReleaseRef {
  /** Canonical GitHub release-notes URL, straight from the entry's front matter. */
  url: string;
  date: Date;
}

// Newest first. Same rule as the /changelog page: published date decides, and
// the version breaks a same-day tie.
function compareVersions(a: string, b: string): number {
  const parts = (v: string) => v.split(/[.-]/).map((n) => Number.parseInt(n, 10) || 0);
  const [left, right] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (right[i] ?? 0) - (left[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * The newest published (non-prerelease) framework release.
 *
 * Throws rather than falling back to a literal: an empty collection means the
 * release sync is broken, and a silent placeholder version is exactly the
 * failure this module exists to remove.
 */
export async function latestRelease(): Promise<LatestRelease> {
  const published = (await getCollection('changelog')).filter((entry) => !entry.data.prerelease);
  if (published.length === 0) {
    throw new Error(
      'No published entries in the `changelog` collection — cannot derive the current release. ' +
        'Check scripts/sync-releases.mjs and src/content/changelog/.',
    );
  }

  const [newest] = published.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
      || compareVersions(a.data.version, b.data.version),
  );

  const { version, tag, url, date } = newest.data;
  return {
    tag,
    version,
    minor: `v${version.split('.').slice(0, 2).join('.')}`,
    url,
    date,
  };
}
