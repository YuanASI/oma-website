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
// Enterprise / commercial-support site (YuanASI). Separate business entity that
// offers paid delivery + consulting on OMA; the OSS site stays zero-commercial.
export const YUANASI = 'https://yuanasi.com';

// Headers for api.github.com calls at build time. Adds Authorization when a
// token is present (GITHUB_TOKEN / GH_TOKEN), lifting GitHub's 60-req/hr
// unauthenticated, per-IP limit to 5,000/hr. This matters for repeated local
// builds and for shared-IP CI / CDN build environments (e.g. Cloudflare Pages),
// where the unauthenticated pool is easily exhausted and a fetch would fall back
// to placeholder data. Raw CDN fetches (raw.githubusercontent.com) aren't
// rate-limited the same way and stay tokenless.
export function ghApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'oma-website-build',
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Build-time memo. ghStats() is awaited from the <head> of every custom page —
// index/architecture/showcase/examples/blog index + every blog post — ~24 calls
// per build. Un-memoized, each re-fetches, firing ~70 api.github.com requests in
// a burst that trips GitHub's *secondary* rate limit (separate from the token's
// 5,000/hr primary budget); the heavy git/trees call in getExamples() then 403s
// and /examples degrades to its fallback. Memoizing collapses it to one fetch.
let statsPromise: ReturnType<typeof fetchGhStats> | null = null;
export function ghStats() {
  return (statsPromise ??= fetchGhStats());
}

async function fetchGhStats() {
  // latestRelease fallback is the last-known tag — like the counts, the displayed
  // value is refetched on every deploy (red-line §7); the literal here is only the
  // offline floor, never the claim.
  const fallback = { stars: 6400, forks: 2391, contributors: 43, latestRelease: 'v1.8.0' };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers = ghApiHeaders();
  try {
    const r = await fetch('https://api.github.com/repos/open-multi-agent/open-multi-agent', { headers });
    if (!r.ok) {
      console.warn(`[ghStats] repo fetch ${r.status} (token ${token ? 'present' : 'MISSING'}, x-ratelimit-remaining=${r.headers.get('x-ratelimit-remaining') ?? '?'}) — using fallback`);
      return fallback;
    }
    const j = await r.json();
    let contributors = fallback.contributors;
    try {
      const cr = await fetch('https://api.github.com/repos/open-multi-agent/open-multi-agent/contributors?per_page=1&anon=true', { headers });
      const m = (cr.headers.get('link') || '').match(/[?&]page=(\d+)>;\s*rel="last"/);
      if (m) contributors = parseInt(m[1], 10);
    } catch { /* keep fallback */ }
    let latestRelease = fallback.latestRelease;
    try {
      const rel = await fetch('https://api.github.com/repos/open-multi-agent/open-multi-agent/releases/latest', { headers });
      if (rel.ok) {
        const rj = await rel.json();
        if (rj.tag_name) latestRelease = rj.tag_name;
      }
    } catch { /* keep fallback */ }
    return {
      stars: j.stargazers_count ?? fallback.stars,
      forks: j.forks_count ?? fallback.forks,
      contributors,
      latestRelease,
    };
  } catch (e) {
    console.warn(`[ghStats] repo fetch threw (token ${token ? 'present' : 'MISSING'}): ${e instanceof Error ? e.message : e} — using fallback`);
    return fallback;
  }
}
