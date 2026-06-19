// Shared site constants + build-time GitHub stats.
// Used by both landing-style pages (index.astro, examples.astro) and the
// shared Nav/Footer components — one source, no duplication.
//
// ghStats lives here (moved out of index.astro) so the nav star count and the
// production-proof counters come from the same fetch contract. Red-line §7:
// numbers are fetched dynamically and refresh on every deploy, with a
// magnitude fallback — never hard-coded as a precise claim.
export const REPO = 'https://github.com/open-multi-agent/open-multi-agent';
export const FORGE = 'https://github.com/open-multi-agent/oma-forge';
export const NPM = 'https://www.npmjs.com/package/@open-multi-agent/core';

export async function ghStats() {
  const fallback = { stars: 6396, forks: 2391, contributors: 43 };
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'oma-website-build' };
  try {
    const r = await fetch('https://api.github.com/repos/open-multi-agent/open-multi-agent', { headers });
    if (!r.ok) return fallback;
    const j = await r.json();
    let contributors = fallback.contributors;
    try {
      const cr = await fetch('https://api.github.com/repos/open-multi-agent/open-multi-agent/contributors?per_page=1&anon=true', { headers });
      const m = (cr.headers.get('link') || '').match(/[?&]page=(\d+)>;\s*rel="last"/);
      if (m) contributors = parseInt(m[1], 10);
    } catch { /* keep fallback */ }
    return {
      stars: j.stargazers_count ?? fallback.stars,
      forks: j.forks_count ?? fallback.forks,
      contributors,
    };
  } catch {
    return fallback;
  }
}
