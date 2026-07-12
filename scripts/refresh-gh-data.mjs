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
const SOURCE_FILE = join(DATA_DIR, 'examples-source.json');

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

// ───────────── example detail (source + structure for /examples/<slug>) ─────────────
// Everything below is EXTRACTED from the real file — the maintainer's own JSDoc
// header and the file's imports — never generated. So the detail pages stay
// honest (red-line §7) and re-sync with upstream on every refresh. Only the three
// "ours" categories get detail pages; providers/integrations still link out.
const DETAIL_CATEGORIES = ['cookbook', 'basics', 'patterns'];

// Section labels that end the intro prose / delimit doc sections. "Scenario" is
// deliberately NOT here — its line is useful intent (the diagram after it stops us).
const SECTION_RE = /^(Run|Prerequisites?|Key features?|Notes?|Usage|Environment|Env vars?|Output|Steps?)\s*:/i;
// ASCII box-drawing / flow lines (task diagrams) — never real prose.
const DIAGRAM_RE = /[│├└┌┐┘┤┬┴┼─→←↑↓]|─{2,}|\+--|\|__/;

// Strip a file's first JSDoc block to bare text lines (leading ` * ` removed).
// Drops the empty leading element between `/**` and the first newline so lines[0]
// is the title line.
function docLines(src) {
  const m = src.match(/\/\*\*([\s\S]*?)\*\//);
  if (!m) return [];
  const lines = m[1].split('\n').map((l) => l.replace(/^\s*\*?\s?/, '').replace(/\s+$/, ''));
  while (lines.length && !lines[0].trim()) lines.shift();
  return lines;
}

// Intent = the descriptive prose right after the title line, up to the first
// section header or diagram line, joined into one paragraph.
function parseIntent(lines) {
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) { if (out.length) break; continue; }
    if (SECTION_RE.test(t) || DIAGRAM_RE.test(t)) break;
    out.push(t);
  }
  // cleanMd normalizes whitespace and strips markdown markers (backticks, links,
  // bold) so the intent is clean plain text for the lede + meta description.
  return cleanMd(out.join(' ')).replace(/[:\s]+$/, '');
}

// Collect the lines under a "Label:" section, until a blank line or the next
// section header. Used for the verbatim "Run:" commands and "Prerequisites:".
function parseSection(lines, labelRe) {
  const out = [];
  let inSec = false;
  for (const raw of lines) {
    const t = raw.trim();
    if (!inSec) {
      if (labelRe.test(t)) {
        inSec = true;
        const after = t.replace(labelRe, '').trim();
        if (after) out.push(after);
      }
      continue;
    }
    if (!t) { if (out.length) break; continue; }
    if (SECTION_RE.test(t)) break;
    out.push(t);
  }
  return out;
}

// The OMA API surface a recipe actually uses = the value symbols it imports from
// the framework's src/index.js entrypoint. Purely factual (it's the import line).
function parseApis(src) {
  const symbols = new Set();
  const re = /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"][^'"]*src\/index\.js['"]/g;
  let m;
  while ((m = re.exec(src))) {
    for (const part of m[1].split(',')) {
      const name = part.replace(/\btype\s+/, '').trim();
      if (name && /^[A-Za-z]/.test(name)) symbols.add(name);
    }
  }
  return [...symbols];
}

function buildDetail(category, ex, src) {
  const lines = docLines(src);
  const title = (lines[0] || '').trim();
  const run = parseSection(lines, /^Run\s*:/i);
  // Prefer the maintainer's JSDoc summary; fall back to the README blurb when the
  // parsed intent is empty, a bare "Demonstrates" lead, or a sentence the parser
  // cut mid-clause (ends on a dangling connective like "either" / "via").
  let intent = parseIntent(lines);
  if (!intent || intent.length < 25 || /\b(?:either|or|and|the|an?|with|via|to|of|for|that|into|when|which|then)$/i.test(intent)) {
    intent = ex.blurb || intent;
  }
  return {
    name: ex.name,
    category,
    title: title || ex.title,
    intent,
    apis: parseApis(src),
    // Fall back to the canonical repo-relative run path (matches the doc's own
    // "Run:" convention) when a file omits an explicit Run block.
    run: run.length ? run : [`npx tsx ${ROOT}/${category}/${ex.name}.ts`],
    prereqs: parseSection(lines, /^Prerequisites?\s*:/i),
    loc: src.replace(/\s+$/, '').split('\n').length,
    blob: ex.href,
    source: src,
  };
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

  const inventory = {
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

  // Detail records (full source + parsed structure) for the "ours" categories,
  // keyed by slug (== name; names are unique across these three categories). Raw
  // CDN fetches aren't rate-limited; a rare miss just omits that page this cycle.
  const detailTargets = DETAIL_CATEGORIES.flatMap((category) =>
    (inventory[category] ?? []).map((ex) => ({ category, ex })),
  );
  const details = {};
  await Promise.all(
    detailTargets.map(async ({ category, ex }) => {
      const src = await fetchText(RAW(`${ROOT}/${category}/${ex.name}.ts`));
      if (src) details[ex.name] = buildDetail(category, ex, src);
    }),
  );

  return { inventory, details, detailExpected: detailTargets.length };
}

// ───────────────────────── main ─────────────────────────

async function main() {
  const prevStats = await readJson(STATS_FILE);

  // Fetch both before writing anything, so a partial failure leaves the snapshot
  // untouched (all-or-nothing).
  const stats = await fetchStats(prevStats);
  const { inventory: examples, details, detailExpected } = await fetchExamples();

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STATS_FILE, JSON.stringify(stats, null, 2) + '\n');
  await writeFile(EXAMPLES_FILE, JSON.stringify(examples, null, 2) + '\n');
  await writeFile(
    SOURCE_FILE,
    JSON.stringify({ repo: `${SLUG}@${BRANCH}`, details }, null, 2) + '\n',
  );

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
  const detailCount = Object.keys(details).length;
  console.log(
    `[refresh] example details: ${detailCount}/${detailExpected} sources captured` +
      (detailCount < detailExpected ? ' — WARNING: some sources missed this cycle' : ''),
  );
}

main().catch((e) => {
  console.error(`[refresh] FAILED: ${e instanceof Error ? e.message : e} — snapshot left unchanged`);
  process.exit(1);
});
