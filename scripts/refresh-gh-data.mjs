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

// Absolute floor — only used the first time, before any snapshot exists. Soft
// sub-parts use the previous committed snapshot after the first successful run.
const STATS_FLOOR = {
  stars: 6400,
  forks: 2391,
  contributors: 43,
  latestRelease: 'v1.8.0',
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

  let contributors = floor.contributors;
  try {
    const contributorResponse = await fetchImpl(`${API}/contributors?per_page=1&anon=true`, { headers });
    const match = (contributorResponse.headers.get('link') || '').match(/[?&]page=(\d+)>;\s*rel="last"/);
    if (match) contributors = Number.parseInt(match[1], 10);
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

  return {
    stars: repository.stargazers_count ?? floor.stars,
    forks: repository.forks_count ?? floor.forks,
    contributors,
    latestRelease,
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
      `contributors=${stats.contributors} release=${stats.latestRelease}`,
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
