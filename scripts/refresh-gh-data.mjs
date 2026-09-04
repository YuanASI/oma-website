// Refresh the committed GitHub snapshots the site builds against.
//
// Repository statistics are live data and continue to track the current
// framework repository. The examples inventory is different: it is generated
// from the catalog and schema at one explicit, immutable framework commit. The
// catalog consumer rejects commit/tree mismatches, invalid metadata, incomplete
// tree coverage, and invalid directory entrypoints before this file writes any
// snapshot. See example-catalog-sync.mjs for that contract.
//
// Run: GITHUB_TOKEN=$(gh auth token) node scripts/refresh-gh-data.mjs

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchExamplesCatalogSnapshot } from './example-catalog-sync.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');
const STATS_FILE = join(DATA_DIR, 'gh-stats.json');
const EXAMPLES_FILE = join(DATA_DIR, 'examples.json');
const SOURCE_FILE = join(DATA_DIR, 'examples-source.json');

const SLUG = 'open-multi-agent/open-multi-agent';
const API = `https://api.github.com/repos/${SLUG}`;
// The one figure in this snapshot that does not come from GitHub. The registry's
// downloads API is public and unauthenticated; it is a soft sub-part like
// contributors, releaseCount and latestRelease, so a failure keeps the
// previous committed number rather than failing the refresh or writing a zero.
const NPM_DOWNLOADS_API =
  'https://api.npmjs.org/downloads/point/last-week/@open-multi-agent/core';

// Absolute floor — only used the first time, before any snapshot exists. Soft
// sub-parts use the previous committed snapshot after the first successful run.
const STATS_FLOOR = {
  stars: 6400,
  forks: 2391,
  contributors: 43,
  releaseCount: 23,
  latestRelease: 'v1.13.0',
};

export function ghApiHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'oma-website-refresh',
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Count every item in a paginated list endpoint. GitHub caps per_page at 100,
// so this walks `Link: rel="next"` and sums the page lengths rather than
// trusting any single response. Returns null — never 0 — when the count cannot
// be established, so callers can keep their last-good value: a repository with
// genuinely zero contributors or releases is not a case this site has to tell
// apart from an outage, but "0 stars-worth of contributors" on the homepage
// would be a visible lie.
//
// PAGE_CAP bounds the walk. At 100 per page it covers 2,000 items; past that
// the count is incomplete, so it reports null rather than a silent undercount.
const PAGE_CAP = 20;

async function countPaginated(url, headers, fetchImpl) {
  let next = url;
  let total = 0;
  for (let page = 0; page < PAGE_CAP && next; page += 1) {
    const response = await fetchImpl(next, { headers });
    if (!response.ok) return null;
    const items = await response.json();
    if (!Array.isArray(items)) return null;
    total += items.length;
    const link = response.headers.get('link') || '';
    const match = link.match(/<([^>]+)>;\s*rel="next"/);
    next = match ? match[1] : null;
  }
  return next ? null : total;
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

export async function fetchStats(previous, fetchImpl = fetch) {
  const headers = ghApiHeaders();
  const floor = previous ?? STATS_FLOOR;
  const response = await fetchImpl(API, { headers });
  if (!response.ok) {
    throw new Error(
      `repo fetch ${response.status} ` +
      `(x-ratelimit-remaining=${response.headers.get('x-ratelimit-remaining') ?? '?'})`,
    );
  }
  const repository = await response.json();

  // anon=0: people with GitHub accounts only. Anonymous (email-only) commit
  // authors are real contributions but not profiles a reader can go and look at,
  // and the homepage cell links straight to the contributors graph.
  let contributors = floor.contributors;
  try {
    const counted = await countPaginated(
      `${API}/contributors?per_page=100&anon=0`,
      headers,
      fetchImpl,
    );
    if (counted !== null) contributors = counted;
  } catch {
    // Keep the last-good value for this soft sub-part.
  }

  let releaseCount = floor.releaseCount;
  try {
    const counted = await countPaginated(`${API}/releases?per_page=100`, headers, fetchImpl);
    if (counted !== null) releaseCount = counted;
  } catch {
    // Keep the last-good value for this soft sub-part.
  }

  let latestRelease = floor.latestRelease;
  try {
    const releaseResponse = await fetchImpl(`${API}/releases/latest`, { headers });
    if (releaseResponse.ok) {
      const release = await releaseResponse.json();
      if (release.tag_name) latestRelease = release.tag_name;
    }
  } catch {
    // Keep the last-good value for this soft sub-part.
  }

  // npm registry, not GitHub: no auth, and deliberately no headers of ours.
  // Only a numeric `downloads` replaces the last-good value — a shape change or
  // an outage leaves the committed number in place, and a missing previous value
  // stays missing so the site omits the figure instead of publishing a zero.
  let npmWeeklyDownloads = floor.npmWeeklyDownloads;
  try {
    const downloadsResponse = await fetchImpl(NPM_DOWNLOADS_API);
    if (downloadsResponse.ok) {
      const point = await downloadsResponse.json();
      if (typeof point.downloads === 'number' && Number.isFinite(point.downloads)) {
        npmWeeklyDownloads = point.downloads;
      }
    }
  } catch {
    // Keep the last-good value for this soft sub-part.
  }

  return {
    stars: repository.stargazers_count ?? floor.stars,
    forks: repository.forks_count ?? floor.forks,
    contributors,
    releaseCount,
    latestRelease,
    npmWeeklyDownloads,
  };
}

export async function refreshSnapshots() {
  const previousStats = await readJson(STATS_FILE);
  const headers = ghApiHeaders();

  // Resolve every input before writing anything. A hard failure leaves all
  // three committed snapshots untouched.
  const [stats, examples] = await Promise.all([
    fetchStats(previousStats),
    fetchExamplesCatalogSnapshot({ headers }),
  ]);

  await mkdir(DATA_DIR, { recursive: true });
  await Promise.all([
    writeFile(STATS_FILE, `${JSON.stringify(stats, null, 2)}\n`),
    writeFile(EXAMPLES_FILE, `${JSON.stringify(examples.inventory, null, 2)}\n`),
    writeFile(SOURCE_FILE, `${JSON.stringify(examples.source, null, 2)}\n`),
  ]);

  const inventory = examples.inventory;
  console.log(
    `[refresh] stats: stars=${stats.stars} forks=${stats.forks} ` +
      `contributors=${stats.contributors} releases=${stats.releaseCount} ` +
      `release=${stats.latestRelease}`,
  );
  console.log(
    `[refresh] examples: ${inventory.entries.length} catalog entries at ` +
      `${inventory.provenance.resolvedCommit}`,
  );
  console.log(
    `[refresh] example details: ${Object.keys(examples.source.details).length} sources captured`,
  );
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  refreshSnapshots().catch((error) => {
    console.error(
      `[refresh] FAILED: ${error instanceof Error ? error.message : error} — snapshots left unchanged`,
    );
    process.exitCode = 1;
  });
}
