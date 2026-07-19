import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const REPO = 'open-multi-agent/open-multi-agent';
export const BRANCH = 'main';
export const REFDIR = 'src/content/docs/reference';
export const RAW = (path) => `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`;
export const BLOB = `https://github.com/${REPO}/blob/${BRANCH}`;

// These upstream docs intentionally remain links to GitHub until they are
// reviewed and given a local page, sidebar entry, and translation.
export const EXCLUDE = new Set([
  'featured-partner',
  // Release-audit evidence, rather than a user-facing product guide.
  'observability-release-readiness',
]);

export const stripH1 = (markdown) => markdown.replace(/^#\s+.*\n+/, '');

export const stripFrontmatter = (markdown) =>
  markdown.replace(/^---\n[\s\S]*?\n---\n\n?/, '');

export function frontmatterOf(markdown, name = 'document') {
  const match = markdown.match(/^---\n[\s\S]*?\n---\n/);
  if (!match) throw new Error(`No front-matter in ${name} — cannot preserve curated metadata`);
  return match[0];
}

export function rewriteLinks(markdown, vendored) {
  return markdown
    .replace(/\]\(\.\.\/([^)]+)\)/g, (_match, path) => `](${BLOB}/${path})`)
    .replace(
      /\]\((?:\.\/)?([\w./-]+)\.md(#[^)]*)?\)/g,
      (_match, name, hash) => {
        if (vendored.has(name)) return `](/reference/${name}/${hash ?? ''})`;
        // Both explicitly excluded and newly discovered targets stay external;
        // the discovery gate separately makes unknown top-level docs visible.
        return `](${BLOB}/docs/${name}.md${hash ?? ''})`;
      },
    );
}

export function transformUpstreamBody(markdown, vendored) {
  return `${rewriteLinks(stripH1(markdown), vendored).replace(/\s+$/, '')}\n`;
}

export function listLocalReferenceSlugs(dir = REFDIR, prefix = '') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return listLocalReferenceSlugs(join(dir, entry.name), `${prefix}${entry.name}/`);
    if (!entry.isFile() || !entry.name.endsWith('.md')) return [];
    return [`${prefix}${entry.name.replace(/\.md$/, '')}`];
  }).sort();
}

export function listLocalFlatReferences(dir = REFDIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name.replace(/\.md$/, ''))
    .sort();
}

export function classifyUpstreamEntries(entries, localReferences, exclude = EXCLUDE) {
  const local = new Set(localReferences);
  const vendored = [];
  const pending = [];
  const unsupportedDirectories = [];

  for (const entry of entries) {
    if (entry.type === 'dir') {
      unsupportedDirectories.push(entry.name);
      continue;
    }
    if (entry.type !== 'file' || !entry.name.endsWith('.md')) continue;

    const name = entry.name.replace(/\.md$/, '');
    if (exclude.has(name)) continue;
    if (local.has(name)) vendored.push(name);
    else pending.push(name);
  }

  return {
    vendored: vendored.sort(),
    pending: pending.sort(),
    unsupportedDirectories: unsupportedDirectories.sort(),
  };
}

export function formatDiscoveryGate({ pending, unsupportedDirectories }) {
  const lines = ['Reference sync discovery gate failed.'];
  if (pending.length) {
    lines.push('', 'New upstream docs need an explicit integration decision:');
    for (const name of pending) lines.push(`- docs/${name}.md`);
    lines.push('Add each page with curated front-matter, sidebar placement, and translation, or add it to EXCLUDE.');
  }
  if (unsupportedDirectories.length) {
    lines.push('', 'Upstream directories are unsupported by the flat Reference sync model:');
    for (const name of unsupportedDirectories) lines.push(`- docs/${name}/`);
    lines.push('Review the directory explicitly before changing the sync model.');
  }
  return lines.join('\n');
}

export function discoveryHasBlockers({ pending, unsupportedDirectories }) {
  return pending.length > 0 || unsupportedDirectories.length > 0;
}

export function hasUpstreamBodyDrift(localBody, upstreamMarkdown, vendored) {
  return localBody !== transformUpstreamBody(upstreamMarkdown, vendored);
}

export function extractSidebarReferenceSlugs(source) {
  const slugs = [];
  const pattern = /\bslug:\s*(['"])reference\/([^'"]+)\1/g;
  for (const match of source.matchAll(pattern)) slugs.push(match[2]);
  return [...new Set(slugs)].sort();
}

export function compareSlugSets(localSlugs, sidebarSlugs) {
  const local = new Set(localSlugs);
  const sidebar = new Set(sidebarSlugs);
  return {
    missingFromSidebar: [...local].filter((slug) => !sidebar.has(slug)).sort(),
    missingLocally: [...sidebar].filter((slug) => !local.has(slug)).sort(),
  };
}

export function readLocalBody(name, dir = REFDIR) {
  return stripFrontmatter(readFileSync(join(dir, `${name}.md`), 'utf8'));
}
