// Shared site constants + GitHub stats.
// Used by both landing-style pages (index.astro, examples.astro) and the
// shared Nav/Footer components — one source, no duplication.
export const REPO = 'https://github.com/open-multi-agent/open-multi-agent';
// The GitHub organization behind the project (its profile lists this site as its
// website). Separate from REPO so JSON-LD can point at the org profile without
// implying it is the repository.
export const GITHUB_ORG = 'https://github.com/open-multi-agent';
// Maintainer profiles, published so the homepage graph can link the person the
// /about page names to accounts anyone can verify.
export const MAINTAINER_GITHUB = 'https://github.com/JackChen-me';
export const MAINTAINER_DEVTO = 'https://dev.to/jackchenme';
export const FORGE = 'https://github.com/open-multi-agent/oma-forge';
export const NPM = 'https://www.npmjs.com/package/@open-multi-agent/core';
// Enterprise / commercial-support site (YuanASI). Separate business entity that
// offers paid delivery + consulting on OMA; the OSS site stays zero-commercial.
export const YUANASI = 'https://yuanasi.com';

import statsSnapshot from '../data/gh-stats.json';

export interface GhStats {
  stars: number;
  forks: number;
  contributors: number;
  /**
   * How many releases the repository has published. Optional for the same
   * reason as `npmWeeklyDownloads` below: `0` is a real count, so it cannot
   * double as "unknown", and a call site must omit the figure rather than
   * publish a zero if the snapshot predates the field. The refresh script keeps
   * the last-good number, so this is only ever undefined on an old snapshot.
   */
  releaseCount?: number;
  latestRelease: string;
  /**
   * Last-week downloads of `@open-multi-agent/core` from the npm registry
   * (api.npmjs.org). Optional on purpose: it is the one figure here that does
   * not come from GitHub, and a call site must render nothing rather than a
   * zero when the snapshot predates the field or the refresh could not reach
   * the registry. `0` is a real download count, so it can never double as
   * "unknown" — hence `undefined`, and hence no floor value for it below.
   */
  npmWeeklyDownloads?: number;
}

// Absolute floor, only if the committed snapshot is ever missing a field. In
// practice the snapshot is always populated with real data, so this never shows.
//
// `latestRelease` has to be a literal here (this is the fallback that runs when
// the derived value is unavailable), so it is the one version literal the site
// keeps on purpose. scripts/check-version-drift.mjs asserts it still matches the
// newest changelog entry — it sat a release behind before that gate existed.
// Prose and page copy interpolate src/lib/release.ts instead.
const STATS_FLOOR: GhStats = { stars: 6400, forks: 2391, contributors: 43, latestRelease: 'v1.14.0' };

// Stats come from a committed snapshot (src/data/gh-stats.json), refreshed
// out-of-band by .github/workflows/refresh-gh-data.yml — NOT fetched live during
// the build. This makes every deploy deterministic: a GitHub blip or rate-limit
// on the build IP can no longer degrade the site to placeholder numbers (the old
// failure mode that forced repeated redeploys). Red-line §7 still holds — the
// numbers are real, fetched from GitHub, and refreshed regularly; they're just
// cached in-repo between refreshes. The landing hero additionally live-refreshes
// stars/forks client-side (see index.astro) for real-time freshness on top.
//
// Kept synchronous-returning but call sites `await ghStats()` — awaiting a plain
// value is a no-op, so the ~14 callers didn't need to change.
export function ghStats(): GhStats {
  const s = statsSnapshot as Partial<GhStats>;
  return {
    stars: typeof s.stars === 'number' ? s.stars : STATS_FLOOR.stars,
    forks: typeof s.forks === 'number' ? s.forks : STATS_FLOOR.forks,
    contributors: typeof s.contributors === 'number' ? s.contributors : STATS_FLOOR.contributors,
    releaseCount: typeof s.releaseCount === 'number' ? s.releaseCount : undefined,
    latestRelease: typeof s.latestRelease === 'string' ? s.latestRelease : STATS_FLOOR.latestRelease,
    npmWeeklyDownloads: typeof s.npmWeeklyDownloads === 'number' ? s.npmWeeklyDownloads : undefined,
  };
}

// Locale-matched enterprise landing on YUANASI. zh → the Chinese homepage; every
// other locale → /en. UTM params let YuanASI analytics tell the Chinese and
// English CTA funnels apart (utm_campaign=zh/en) and attribute contacts back to
// this site. One helper so the footer's Enterprise-support link, the
// EnterpriseCta block, and the nav's For Companies entry all resolve the same
// target — the URL contract lives here, not copied at each call site.
export function yuanasiHref(locale: string): string {
  const base = locale === 'zh' ? YUANASI : `${YUANASI}/en`;
  const campaign = locale === 'zh' ? 'zh' : 'en';
  return `${base}?utm_source=open-multi-agent.com&utm_medium=enterprise-cta&utm_campaign=${campaign}`;
}
