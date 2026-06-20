// Sync the vendored Reference docs from the framework repo's `main` branch into
// src/content/docs/reference/. Run on a schedule by
// .github/workflows/sync-reference.yml (which opens a PR with any changes —
// never auto-merges; the build CI + a human review gate it). Also runnable
// locally:  node scripts/sync-reference-docs.mjs
//
// Design (PRD §4.2 / §7 — prevent the docs drifting from the framework):
//   • Tracks `main` (latest), not a pinned tag.
//   • Each vendored file's Starlight front-matter (title + the hand-written
//     description) is CURATED and PRESERVED; only the body is refreshed.
//   • The upstream `# H1` is dropped (Starlight renders the title from
//     front-matter), and framework-relative links are rewritten to forms that
//     resolve on the site.
//   • New upstream docs are reported but NOT auto-added — they need a sidebar
//     slot (astro.config.mjs) and a red-line review first.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'open-multi-agent/open-multi-agent';
const BRANCH = 'main';
const RAW = (p) => `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${p}`;
const BLOB = `https://github.com/${REPO}/blob/${BRANCH}`;
const REFDIR = 'src/content/docs/reference';

// Vendored reference files ↔ framework `docs/<name>.md`. Only these sync.
const FILES = [
  'checkpoint', 'cli', 'consensus', 'context-management', 'model-routing', 'observability',
  'providers', 'providers/minimax', 'shared-memory', 'tool-configuration',
];

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const apiHeaders = token
  ? { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
  : { Accept: 'application/vnd.github+json' };

// Rewrite framework-relative markdown links to forms that resolve on the site:
//   ](../<repo path>)   → absolute GitHub blob URL (escapes docs/ to repo root)
//   ](./x.md) / ](x.md) → /reference/x/   (intra-docs → Starlight route)
// The intra-docs rule excludes protocol URLs ([\w./-] can't match ':'), so it
// never touches the absolute links produced by the first rule.
const rewriteLinks = (md) =>
  md
    .replace(/\]\(\.\.\/([^)]+)\)/g, (_m, p) => `](${BLOB}/${p})`)
    .replace(/\]\((?:\.\/)?([\w./-]+)\.md(#[^)]*)?\)/g,
      (_m, name, hash) => `](/reference/${name}/${hash ?? ''})`);

// Drop a leading "# Title" heading (+ following blank lines) from the body.
const stripH1 = (md) => md.replace(/^#\s+.*\n+/, '');

function frontmatter(file) {
  const m = readFileSync(join(REFDIR, `${file}.md`), 'utf8').match(/^---\n[\s\S]*?\n---\n/);
  if (!m) throw new Error(`No front-matter in ${file}.md — cannot preserve curated metadata`);
  return m[0];
}

let changed = 0;
let failed = 0;
for (const file of FILES) {
  const path = join(REFDIR, `${file}.md`);
  if (!existsSync(path)) { console.warn('skip (not vendored locally):', file); continue; }
  const r = await fetch(RAW(`docs/${file}.md`));
  if (!r.ok) { console.error('FAIL fetch', file, r.status); failed++; continue; }
  const body = `${rewriteLinks(stripH1(await r.text())).replace(/\s+$/, '')}\n`;
  const next = `${frontmatter(file)}\n${body}`;
  if (next !== readFileSync(path, 'utf8')) { writeFileSync(path, next); changed++; console.log('updated', file); }
  else console.log('unchanged', file);
}

// Report (don't add) new upstream docs so the team can decide on placement.
try {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/docs?ref=${BRANCH}`, { headers: apiHeaders });
  if (r.ok) {
    const known = new Set(FILES.map((f) => `${f}.md`));
    const novel = (await r.json())
      .filter((e) => e.type === 'file' && e.name.endsWith('.md') && !known.has(e.name))
      .map((e) => e.name);
    if (novel.length) console.log(`\nNEW upstream docs (not auto-added — need a sidebar slot + review): ${novel.join(', ')}`);
  }
} catch { /* reporting only */ }

console.log(`\n${changed} file(s) changed, ${failed} fetch failure(s)`);
if (failed) process.exitCode = 1;
