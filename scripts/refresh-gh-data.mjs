// Refresh the committed GitHub snapshot the site builds against.
//
// WHY THIS EXISTS: the landing stats (stars/forks/contributors/release) and the
// /examples inventory used to be fetched from the GitHub API *at build time*, in
// src/lib/site.ts and src/lib/examples.ts. That made every production deploy
// depend on a live fetch succeeding on the shared Cloudflare Pages build IP — a
// transient blip / rate-limit degraded the whole deploy to placeholder numbers,
// and you had to redeploy until you got lucky.
//
// This script moves that fetch OUT of the build. It runs on a schedule
// (.github/workflows/refresh-gh-data.yml), on GitHub Actions' reliable token +
// IP, and writes the results to src/data/{gh-stats,examples}.json. The build then
// just imports those files — deterministic, offline, never degrades. Red-line §7
// still holds: the numbers are real, fetched from GitHub, and refreshed regularly;
// they're only cached in-repo between refreshes.
//
// On any HARD failure (the repo call or the git/trees call 4xx/5xx), the script
// exits non-zero and writes NOTHING — the last-good snapshot stays committed, so a
// bad refresh can never regress the site. Soft sub-parts (contributors count,
// latest release) fall back to the PREVIOUS snapshot's value, not a stale literal.
//
// Run: GITHUB_TOKEN=$(gh auth token) node scripts/refresh-gh-data.mjs

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');
const STATS_FILE = join(DATA_DIR, 'gh-stats.json');
const EXAMPLES_FILE = join(DATA_DIR, 'examples.json');

const SLUG = 'open-multi-agent/open-multi-agent';
const BRANCH = 'main';
const ROOT = 'packages/core/examples';
const API = `https://api.github.com/repos/${SLUG}`;

const RAW = (p) => `https://raw.githubusercontent.com/${SLUG}/${BRANCH}/${p}`;
const BLOB = (p) => `https://github.com/${SLUG}/blob/${BRANCH}/${p}`;
const TREE = (p) => `https://github.com/${SLUG}/tree/${BRANCH}/${p}`;

// Absolute floor — only used the very first time, before any snapshot exists.
// After the first successful run, soft sub-parts fall back to the last snapshot.
const STATS_FLOOR = { stars: 6400, forks: 2391, contributors: 43, latestRelease: 'v1.8.0' };

// Headers for api.github.com. Adds Authorization when a token is present
// (GITHUB_TOKEN / GH_TOKEN), lifting the 60-req/hr unauthenticated per-IP limit to
// 5,000/hr. Raw CDN fetches (raw.githubusercontent.com) aren't rate-limited.
function ghApiHeaders() {
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

async function fetchText(url) {
  try {
    const r = await fetch(url);
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
}

// ───────────────────────── stats ─────────────────────────

async function fetchStats(prev) {
  const headers = ghApiHeaders();
  const floor = prev ?? STATS_FLOOR;

  const r = await fetch(API, { headers });
  if (!r.ok) {
    throw new Error(
      `repo fetch ${r.status} (x-ratelimit-remaining=${r.headers.get('x-ratelimit-remaining') ?? '?'})`,
    );
  }
  const j = await r.json();

  // Soft: contributor count via the pagination "last" link. On failure keep the
  // previous snapshot's value rather than regressing to the hard-coded floor.
  let contributors = floor.contributors;
  try {
    const cr = await fetch(`${API}/contributors?per_page=1&anon=true`, { headers });
    const m = (cr.headers.get('link') || '').match(/[?&]page=(\d+)>;\s*rel="last"/);
    if (m) contributors = parseInt(m[1], 10);
  } catch {
    /* keep last-good */
  }

  // Soft: latest release tag. Same last-good discipline.
  let latestRelease = floor.latestRelease;
  try {
    const rel = await fetch(`${API}/releases/latest`, { headers });
    if (rel.ok) {
      const rj = await rel.json();
      if (rj.tag_name) latestRelease = rj.tag_name;
    }
  } catch {
    /* keep last-good */
  }

  return {
    stars: j.stargazers_count ?? floor.stars,
    forks: j.forks_count ?? floor.forks,
    contributors,
    latestRelease,
  };
}

// ─────────────────────── examples ───────────────────────
// Ported verbatim from the old src/lib/examples.ts build-time fetcher; this script
// is now the single owner of that logic (the lib just reads the JSON it writes).

const ACRONYMS = {
  dag: 'DAG', mcp: 'MCP', api: 'API', ai: 'AI', sdk: 'SDK', db: 'DB', qa: 'QA',
  sre: 'SRE', llm: 'LLM', ui: 'UI', github: 'GitHub', openai: 'OpenAI',
  tencentdb: 'TencentDB', azure: 'Azure', aws: 'AWS', json: 'JSON', http: 'HTTP',
  rest: 'REST', glm: 'GLM',
};

function titleCase(slug, stripWith = false) {
  let s = slug;
  if (stripWith && s.startsWith('with-')) s = s.slice('with-'.length);
  return s
    .split('-')
    .map((w) => ACRONYMS[w.toLowerCase()] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function cleanMd(s) {
  return s
    .replace(/\[`?([^`\]]+)`?\]\([^)]*\)/g, '$1')
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTables(md) {
  const map = new Map();
  for (const line of md.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const link = line.match(/\]\(([^)]+)\)/);
    if (!link) continue;
    const target = link[1].trim().replace(/^\.\//, '').replace(/\.ts$/, '').replace(/\/$/, '');
    const parts = line.split('|');
    const desc = cleanMd((parts[2] ?? '').trim());
    if (!desc || desc.startsWith('---')) continue;
    map.set(target, desc);
  }
  return map;
}

function parseBullets(md) {
  const map = new Map();
  const folded = md.replace(/\n[ \t]+(?=\S)/g, ' ');
  const re = /^[-*]\s+`([^`]+?)\/?`:\s*(.+)$/gm;
  let m;
  while ((m = re.exec(folded))) {
    const key = m[1].replace(/\.ts$/, '').replace(/\/$/, '');
    const desc = cleanMd(m[2]).replace(/\s*Contributed by.*$/i, '').trim();
    map.set(key, desc);
  }
  return map;
}

function firstDocLine(src) {
  const block = src.match(/\/\*\*([\s\S]*?)\*\//);
  if (!block) return '';
  for (const raw of block[1].split('\n')) {
    const t = raw.replace(/^\s*\*?\s?/, '').trim();
    if (t) return t;
  }
  return '';
}

async function fetchExamples() {
  const headers = ghApiHeaders();

  const res = await fetch(`${API}/git/trees/${BRANCH}?recursive=1`, { headers });
  if (!res.ok) {
    throw new Error(
      `git/trees ${res.status} (x-ratelimit-remaining=${res.headers.get('x-ratelimit-remaining') ?? '?'})`,
    );
  }
  const json = await res.json();
  const paths = json.tree.filter((t) => t.path.startsWith(ROOT + '/'));
  if (!paths.length) throw new Error(`git/trees ok but 0 entries under ${ROOT}/`);

  const rel = (p) => p.slice(ROOT.length + 1);

  const leafTs = (dir) => {
    const prefix = dir + '/';
    return paths
      .filter((t) => t.type === 'blob')
      .map((t) => rel(t.path))
      .filter((r) => r.startsWith(prefix) && r.endsWith('.ts') && !r.slice(prefix.length).includes('/'))
      .map((r) => r.slice(prefix.length, -'.ts'.length))
      .sort();
  };

  const subDirs = (dir) => {
    const prefix = dir + '/';
    const set = new Set();
    for (const t of paths) {
      const r = rel(t.path);
      if (!r.startsWith(prefix)) continue;
      const rest = r.slice(prefix.length);
      const i = rest.indexOf('/');
      if (i > -1) set.add(rest.slice(0, i));
    }
    return [...set].sort();
  };

  const hasFile = (dirRel, file) => paths.some((t) => rel(t.path) === `${dirRel}/${file}`);

  const [mainMd, intMd] = await Promise.all([
    fetchText(RAW(`${ROOT}/README.md`)),
    fetchText(RAW(`${ROOT}/integrations/README.md`)),
  ]);
  const tableDesc = mainMd ? parseTables(mainMd) : new Map();
  const bulletDesc = intMd ? parseBullets(intMd) : new Map();

  const pending = [];
  const fileEx = (dir, name) => {
    const key = `${dir}/${name}`;
    const ex = {
      name,
      title: titleCase(name),
      blurb: tableDesc.get(key) ?? '',
      href: BLOB(`${ROOT}/${dir}/${name}.ts`),
    };
    if (!ex.blurb) pending.push({ ex, relTs: `${ROOT}/${dir}/${name}.ts` });
    return ex;
  };

  const cookbook = leafTs('cookbook').map((n) => fileEx('cookbook', n));
  const basics = leafTs('basics').map((n) => fileEx('basics', n));
  const patterns = leafTs('patterns').map((n) => fileEx('patterns', n));
  const providers = leafTs('providers').map((n) => fileEx('providers', n));
  const reference = leafTs('integrations').map((n) => fileEx('integrations', n));

  const apps = [];
  const vendor = [];
  for (const sub of subDirs('integrations')) {
    const dirRel = `integrations/${sub}`;
    const ex = {
      name: sub,
      title: titleCase(sub, true),
      blurb: tableDesc.get(dirRel) ?? bulletDesc.get(sub) ?? '',
      href: TREE(`${ROOT}/${dirRel}`),
    };
    (hasFile(dirRel, 'package.json') ? apps : vendor).push(ex);
  }

  await Promise.all(
    pending.map(async ({ ex, relTs }) => {
      const src = await fetchText(RAW(relTs));
      if (src) ex.blurb = firstDocLine(src);
    }),
  );

  return {
    cookbook,
    apps,
    reference,
    vendor,
    basics,
    patterns,
    providers,
    productionHref: TREE(`${ROOT}/production`),
    browseHref: TREE(ROOT),
  };
}

// ───────────────────────── main ─────────────────────────

async function main() {
  const prevStats = await readJson(STATS_FILE);

  // Fetch both before writing anything, so a partial failure leaves the snapshot
  // untouched (all-or-nothing).
  const stats = await fetchStats(prevStats);
  const examples = await fetchExamples();

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STATS_FILE, JSON.stringify(stats, null, 2) + '\n');
  await writeFile(EXAMPLES_FILE, JSON.stringify(examples, null, 2) + '\n');

  const total =
    examples.cookbook.length + examples.apps.length + examples.reference.length +
    examples.vendor.length + examples.basics.length + examples.patterns.length +
    examples.providers.length;
  console.log(
    `[refresh] stats: stars=${stats.stars} forks=${stats.forks} ` +
      `contributors=${stats.contributors} release=${stats.latestRelease}`,
  );
  console.log(
    `[refresh] examples: ${total} entries ` +
      `(cookbook=${examples.cookbook.length} apps=${examples.apps.length} ` +
      `reference=${examples.reference.length} vendor=${examples.vendor.length} ` +
      `basics=${examples.basics.length} patterns=${examples.patterns.length} ` +
      `providers=${examples.providers.length})`,
  );
}

main().catch((e) => {
  console.error(`[refresh] FAILED: ${e instanceof Error ? e.message : e} — snapshot left unchanged`);
  process.exit(1);
});
