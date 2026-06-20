// Build-time inventory of the framework's example suite, for /examples.
//
// PRD §4.3 hard requirement: the page must list EVERY entry and stay in sync
// with the repo — no hand-maintained list. So the canonical inventory comes
// from the repo's git tree (one API call, zero drift), and one-line blurbs are
// enriched from the maintained README tables, falling back to each file's
// header docstring for entries the README table hasn't caught up with.
//
// Note (2026-06-19): examples moved from the old top-level `examples/` to
// `packages/core/examples/` when the framework went monorepo. §4.3 (06-11)
// predates that — this module tracks the real path.
//
// Everything is fetched at build time. On any failure getExamples() returns
// null and the page degrades to a "browse on GitHub" link (same fetch-with-
// fallback discipline as ghStats in ./site).

import { ghApiHeaders } from './site';

const SLUG = 'open-multi-agent/open-multi-agent';
const BRANCH = 'main';
const ROOT = 'packages/core/examples';

const RAW = (p: string) => `https://raw.githubusercontent.com/${SLUG}/${BRANCH}/${p}`;
const BLOB = (p: string) => `https://github.com/${SLUG}/blob/${BRANCH}/${p}`;
const TREE = (p: string) => `https://github.com/${SLUG}/tree/${BRANCH}/${p}`;

export interface Example {
  name: string; // raw slug, e.g. "contract-review-dag" (shown mono in compact lists)
  title: string; // humanized, e.g. "Contract Review DAG" (shown in cards)
  blurb: string; // one-line scenario / what-it-shows
  href: string; // link to source on GitHub
}

// Static fallback for the /examples page when the build-time fetch fails (no
// GITHUB_TOKEN / rate limit) and getExamples() returns null. A small curated
// slice of the real cookbook — slugs and blurbs verified against
// packages/core/examples/README.md so they match the live gallery — so the
// page degrades to real, clickable recipes instead of an empty "go to GitHub"
// dead end. Keep in sync if a cookbook entry is renamed/removed upstream.
export const FALLBACK_EXAMPLES: Example[] = [
  { name: 'contract-review-dag', title: 'Contract Review DAG', blurb: 'A 4-task DAG — extract, then a parallel compliance-check and summary, then notify — with step-level retry.', href: BLOB(`${ROOT}/cookbook/contract-review-dag.ts`) },
  { name: 'incident-postmortem-dag', title: 'Incident Postmortem DAG', blurb: 'A 5-task DAG: three parallel root investigations feed a root-cause hypothesis and final postmortem synthesis.', href: BLOB(`${ROOT}/cookbook/incident-postmortem-dag.ts`) },
  { name: 'competitive-monitoring', title: 'Competitive Monitoring', blurb: 'Parallel source monitoring, contradiction detection, and an aggregated intelligence report.', href: BLOB(`${ROOT}/cookbook/competitive-monitoring.ts`) },
  { name: 'meeting-summarizer', title: 'Meeting Summarizer', blurb: 'Fan a transcript out into a summary, structured action items, and sentiment.', href: BLOB(`${ROOT}/cookbook/meeting-summarizer.ts`) },
  { name: 'paper-replication-triage', title: 'Paper Replication Triage', blurb: 'Multi-source paper-replication triage with artifact discovery and a structured go/no-go plan.', href: BLOB(`${ROOT}/cookbook/paper-replication-triage.ts`) },
];

export interface ExamplesData {
  cookbook: Example[];
  apps: Example[];
  reference: Example[];
  vendor: Example[];
  basics: Example[];
  patterns: Example[];
  providers: Example[];
  productionHref: string;
  browseHref: string;
}

// Acronyms/proper nouns that shouldn't be naively title-cased.
const ACRONYMS: Record<string, string> = {
  dag: 'DAG', mcp: 'MCP', api: 'API', ai: 'AI', sdk: 'SDK', db: 'DB', qa: 'QA',
  sre: 'SRE', llm: 'LLM', ui: 'UI', github: 'GitHub', openai: 'OpenAI',
  tencentdb: 'TencentDB', azure: 'Azure', aws: 'AWS', json: 'JSON', http: 'HTTP',
  rest: 'REST', glm: 'GLM',
};

function titleCase(slug: string, stripWith = false): string {
  let s = slug;
  if (stripWith && s.startsWith('with-')) s = s.slice('with-'.length);
  return s
    .split('-')
    .map((w) => ACRONYMS[w.toLowerCase()] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Strip light markdown so a table/bullet cell renders as plain text.
function cleanMd(s: string): string {
  return s
    .replace(/\[`?([^`\]]+)`?\]\([^)]*\)/g, '$1') // [text](url) -> text
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse every markdown table in the README into { relPath -> blurb }. The 1st
// column is a link to the example; the blurb is the 2nd column (covers all
// table shapes here — cookbook "Problem solved", providers "Provider",
// apps "Stack", etc.). Rows without an example link (e.g. the "Adding a new
// example" guide) are skipped.
function parseTables(md: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of md.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const link = line.match(/\]\(([^)]+)\)/);
    if (!link) continue;
    const target = link[1].trim().replace(/^\.\//, '').replace(/\.ts$/, '').replace(/\/$/, '');
    const parts = line.split('|'); // ['', col1, col2, col3, '']
    const desc = cleanMd((parts[2] ?? '').trim());
    if (!desc || desc.startsWith('---')) continue;
    map.set(target, desc);
  }
  return map;
}

// Parse the integrations sub-README bullets (the only source that describes the
// vendor integrations, which aren't in the main README tables).
// Lines look like: - `with-engram/`: Engram memory backend. Contributed by ...
function parseBullets(md: string): Map<string, string> {
  const map = new Map<string, string>();
  // Bullets can wrap across lines in the source; fold indented continuation
  // lines back onto their bullet before matching (else the blurb is truncated).
  const folded = md.replace(/\n[ \t]+(?=\S)/g, ' ');
  const re = /^[-*]\s+`([^`]+?)\/?`:\s*(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(folded))) {
    const key = m[1].replace(/\.ts$/, '').replace(/\/$/, '');
    const desc = cleanMd(m[2]).replace(/\s*Contributed by.*$/i, '').trim();
    map.set(key, desc);
  }
  return map;
}

// First sentence of a `/** ... */` header docstring (the example's own title
// line, used only when the README table hasn't described an entry yet).
function firstDocLine(src: string): string {
  const block = src.match(/\/\*\*([\s\S]*?)\*\//);
  if (!block) return '';
  for (const raw of block[1].split('\n')) {
    const t = raw.replace(/^\s*\*?\s?/, '').trim();
    if (t) return t;
  }
  return '';
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
}

export async function getExamples(): Promise<ExamplesData | null> {
  const headers = ghApiHeaders();
  let paths: { path: string; type: string }[];
  try {
    const res = await fetch(`https://api.github.com/repos/${SLUG}/git/trees/${BRANCH}?recursive=1`, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    paths = (json.tree as { path: string; type: string }[]).filter((t) => t.path.startsWith(ROOT + '/'));
    if (!paths.length) return null;
  } catch {
    return null;
  }

  const rel = (p: string) => p.slice(ROOT.length + 1);

  // .ts files directly inside ROOT/<dir> (not in a deeper subfolder).
  const leafTs = (dir: string): string[] => {
    const prefix = dir + '/';
    return paths
      .filter((t) => t.type === 'blob')
      .map((t) => rel(t.path))
      .filter((r) => r.startsWith(prefix) && r.endsWith('.ts') && !r.slice(prefix.length).includes('/'))
      .map((r) => r.slice(prefix.length, -'.ts'.length))
      .sort();
  };

  // Immediate subdirectories of ROOT/<dir>.
  const subDirs = (dir: string): string[] => {
    const prefix = dir + '/';
    const set = new Set<string>();
    for (const t of paths) {
      const r = rel(t.path);
      if (!r.startsWith(prefix)) continue;
      const rest = r.slice(prefix.length);
      const i = rest.indexOf('/');
      if (i > -1) set.add(rest.slice(0, i));
    }
    return [...set].sort();
  };

  const hasFile = (dirRel: string, file: string) => paths.some((t) => rel(t.path) === `${dirRel}/${file}`);

  // Description sources (raw CDN — not subject to the API rate limit).
  const [mainMd, intMd] = await Promise.all([
    fetchText(RAW(`${ROOT}/README.md`)),
    fetchText(RAW(`${ROOT}/integrations/README.md`)),
  ]);
  const tableDesc = mainMd ? parseTables(mainMd) : new Map<string, string>();
  const bulletDesc = intMd ? parseBullets(intMd) : new Map<string, string>();

  // Build a flat-file example; record entries whose blurb is still missing so
  // we can backfill from their docstring in one parallel pass.
  const pending: { ex: Example; relTs: string }[] = [];
  const fileEx = (dir: string, name: string): Example => {
    const key = `${dir}/${name}`;
    const ex: Example = {
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

  // Integration subdirectories: own package.json => runnable app, else vendor.
  const apps: Example[] = [];
  const vendor: Example[] = [];
  for (const sub of subDirs('integrations')) {
    const dirRel = `integrations/${sub}`;
    const ex: Example = {
      name: sub,
      title: titleCase(sub, true),
      blurb: tableDesc.get(dirRel) ?? bulletDesc.get(sub) ?? '',
      href: TREE(`${ROOT}/${dirRel}`),
    };
    (hasFile(dirRel, 'package.json') ? apps : vendor).push(ex);
  }

  // Backfill missing blurbs from docstrings, in parallel.
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
