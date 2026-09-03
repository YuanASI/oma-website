import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const REPO = 'open-multi-agent/open-multi-agent';
export const PACKAGE = '@open-multi-agent/core';
export const REFDIR = 'src/content/docs/reference';
export const REFERENCE_REF_ENV = 'OMA_REFERENCE_REF';
export const RAW = (path, ref = 'main') => `https://raw.githubusercontent.com/${REPO}/${ref}/${path}`;
export const BLOB = (ref = 'main') => `https://github.com/${REPO}/blob/${ref}`;

// These upstream docs intentionally remain links to GitHub until they are
// reviewed and given a local page, sidebar entry, and translation.
export const EXCLUDE = new Set([
  'featured-partner',
  // Release-audit evidence, rather than a user-facing product guide.
  'observability-release-readiness',
  // Sponsor onboarding: voucher codes that are claimed one by one plus a
  // sponsorship disclosure. It changes on the sponsor's clock, not the
  // release's, so it stays upstream where an edit needs no site deploy.
  'providers-atlascloud',
  // Upstream's own Chinese copy of that page. Nothing under src/content/docs/zh
  // is vendored — translations are produced here per TRANSLATING.md — and the
  // flat sync model has no notion of a locale-suffixed upstream file.
  'providers-atlascloud_zh',
]);

// The Reference section index (reference/index.md) is a hand-written hub for the
// /reference/ URL: it links the pages under it, has no upstream counterpart in
// the framework repo, and is reached through its own sidebar entry (`slug:
// 'reference'`, not `reference/<slug>`). So it takes part in none of the sync
// comparisons below — counting it would report phantom drift against upstream
// and a phantom sidebar mismatch.
const isSectionHub = (name) => name === 'index';

export const stripH1 = (markdown) => markdown.replace(/^#\s+.*\n+/, '');

export const stripFrontmatter = (markdown) =>
  markdown.replace(/^---\n[\s\S]*?\n---\n\n?/, '');

export async function resolvePublishedReferenceRef(
  headers = {},
  override = process.env[REFERENCE_REF_ENV],
  fetchImpl = fetch,
) {
  if (override) return override;

  const [releaseResponse, registryResponse] = await Promise.all([
    fetchImpl(`https://api.github.com/repos/${REPO}/releases/latest`, { headers }),
    fetchImpl(`https://registry.npmjs.org/${encodeURIComponent(PACKAGE)}`),
  ]);
  if (!releaseResponse.ok) {
    throw new Error(`GitHub latest release API returned ${releaseResponse.status}`);
  }
  if (!registryResponse.ok) {
    throw new Error(`npm registry returned ${registryResponse.status}`);
  }

  const release = await releaseResponse.json();
  const registry = await registryResponse.json();
  const releaseTag = typeof release?.tag_name === 'string' ? release.tag_name : '';
  const npmVersion = typeof registry?.['dist-tags']?.latest === 'string'
    ? registry['dist-tags'].latest
    : '';

  if (!releaseTag || !npmVersion) {
    throw new Error('Unable to resolve a GitHub release tag and npm latest version');
  }
  if (releaseTag !== `v${npmVersion}`) {
    throw new Error(
      `Release truth mismatch: GitHub latest is ${releaseTag}, npm latest is ${npmVersion}`,
    );
  }
  return releaseTag;
}

export function frontmatterOf(markdown, name = 'document') {
  const match = markdown.match(/^---\n[\s\S]*?\n---\n/);
  if (!match) throw new Error(`No front-matter in ${name} — cannot preserve curated metadata`);
  return match[0];
}

export function rewriteLinks(markdown, vendored, ref = 'main') {
  return markdown
    .replace(/\]\(\.\.\/([^)]+)\)/g, (_match, path) => `](${BLOB(ref)}/${path})`)
    .replace(
      /\]\((?:\.\/)?([\w./-]+)\.md(#[^)]*)?\)/g,
      (_match, name, hash) => {
        if (vendored.has(name)) return `](/reference/${name}/${hash ?? ''})`;
        // Both explicitly excluded and newly discovered targets stay external;
        // the discovery gate separately makes unknown top-level docs visible.
        return `](${BLOB(ref)}/docs/${name}.md${hash ?? ''})`;
      },
    );
}

export function transformUpstreamBody(markdown, vendored, ref = 'main') {
  return `${rewriteLinks(stripH1(markdown), vendored, ref).replace(/\s+$/, '')}\n`;
}

export function listLocalReferenceSlugs(dir = REFDIR, prefix = '') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return listLocalReferenceSlugs(join(dir, entry.name), `${prefix}${entry.name}/`);
    if (!entry.isFile() || !entry.name.endsWith('.md')) return [];
    const slug = entry.name.replace(/\.md$/, '');
    if (isSectionHub(slug)) return [];
    return [`${prefix}${slug}`];
  }).sort();
}

export function listLocalFlatReferences(dir = REFDIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name.replace(/\.md$/, ''))
    .filter((name) => !isSectionHub(name))
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

export function hasUpstreamBodyDrift(localBody, upstreamMarkdown, vendored, ref = 'main') {
  return localBody !== transformUpstreamBody(upstreamMarkdown, vendored, ref);
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
