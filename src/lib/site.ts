// Shared site constants + GitHub stats.
// Used by both landing-style pages (index.astro, examples.astro) and the
// shared Nav/Footer components — one source, no duplication.
export const REPO = 'https://github.com/open-multi-agent/open-multi-agent';
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
  latestRelease: string;
}

// Absolute floor, only if the committed snapshot is ever missing a field. In
// practice the snapshot is always populated with real data, so this never shows.
const STATS_FLOOR: GhStats = { stars: 6400, forks: 2391, contributors: 43, latestRelease: 'v1.8.0' };

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
    latestRelease: typeof s.latestRelease === 'string' ? s.latestRelease : STATS_FLOOR.latestRelease,
  };
}

// Locale-matched enterprise landing on YUANASI. zh → the Chinese root; every other
// locale → /en. One helper so the footer's Enterprise-support link, the
// EnterpriseCta block, and the nav's For Companies entry all resolve the same
// target — the URL contract lives here, not copied at each call site.
export function yuanasiHref(locale: string): string {
  return locale === 'zh' ? YUANASI : `${YUANASI}/en`;
}
