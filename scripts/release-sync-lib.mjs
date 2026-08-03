// Pure transforms behind scripts/sync-releases.mjs — the release notes vendored
// into src/content/changelog/. Split from the I/O so `node --test` can exercise
// the body transform and the ordering rules (mirrors reference-sync-lib.mjs).
//
// The site is the ARCHIVE: upstream CHANGELOG.md carries only the last couple of
// releases, while the GitHub releases go back to v1.0.0. Every published release
// is vendored here as one file, so trimming upstream never loses site history.
import { existsSync, readdirSync } from 'node:fs';
import { REPO, BLOB, listLocalFlatReferences } from './reference-sync-lib.mjs';

export const CHANGELOG_DIR = 'src/content/changelog';
export const RELEASES_API = `https://api.github.com/repos/${REPO}/releases`;
export const ISSUE_URL = (number) => `https://github.com/${REPO}/issues/${number}`;
export const USER_URL = (login) => `https://github.com/${login}`;

// Spans whose contents must never be autolinked: fenced code, inline code,
// existing markdown links/images (label AND destination — v1.3.0 already ships
// a hand-written `[@agentsonar](…)`), and bare URLs.
const PROTECTED = /(```[\s\S]*?```|`[^`\n]*`|!?\[[^\]]*\]\([^)]*\)|https?:\/\/\S+)/g;

// GitHub logins: alphanumerics and interior hyphens, 39 chars max. The leading
// guard keeps `core@1.13.0` and `oma-app@latest` out; the trailing guard keeps
// scoped package names (`@open-multi-agent/core`) out. A login must carry at
// least one letter, which is what rejects version tails like `@1.13.0` → `@1`.
const MENTION = /(^|[^\w`/@.-])@([A-Za-z\d](?:[A-Za-z\d]|-(?=[A-Za-z\d])){0,38})(?![\w/-])/g;
const ISSUE_REF = /(^|[^\w`/@.-])#(\d+)\b/g;

/** `v1.14.0` → `1.14.0`. Tags without the `v` prefix pass through. */
export function releaseVersion(tag) {
  return String(tag ?? '').replace(/^v/, '');
}

/** Numeric semver ordering, newest first; unparsable parts sort as 0. */
export function compareVersionsDesc(a, b) {
  const parts = (v) => releaseVersion(v).split(/[.-]/).map((n) => Number.parseInt(n, 10) || 0);
  const left = parts(a);
  const right = parts(b);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (right[i] ?? 0) - (left[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Drafts never ship. Everything published (including prereleases) is vendored. */
export function isVendorableRelease(release) {
  return Boolean(release) && release.draft !== true && typeof release.tag_name === 'string';
}

// Framework doc links resolve on the site when that Reference page is vendored
// here, and stay on GitHub otherwise. Covers both forms the release notes use:
// repo-relative (`docs/adaptive-recovery.md`) and absolute blob URLs.
export function rewriteReleaseLinks(markdown, vendored = new Set()) {
  const target = (name, hash = '') =>
    vendored.has(name) ? `/reference/${name}/${hash}` : `${BLOB()}/docs/${name}.md${hash}`;
  return markdown
    .replace(
      /\]\((?:\.\/)?docs\/([\w.-]+)\.md(#[^)]*)?\)/g,
      (_match, name, hash) => `](${target(name, hash ?? '')})`,
    )
    .replace(
      new RegExp(`\\]\\(https://github\\.com/${REPO}/blob/[^/]+/docs/([\\w.-]+)\\.md(#[^)]*)?\\)`, 'g'),
      (_match, name, hash) => `](${target(name, hash ?? '')})`,
    );
}

/**
 * Autolink GitHub `@login` mentions and `#123` refs the way github.com renders
 * them, so contributor credit and PR references survive the mirror as links.
 * Issue URLs are used for refs because GitHub redirects `/issues/N` to the pull
 * request when N is one — the reverse 404s.
 */
export function autolinkGitHubRefs(markdown) {
  return markdown
    .split(PROTECTED)
    .map((segment, index) => {
      // split() with one capture group interleaves: even = plain, odd = protected.
      if (index % 2 === 1) return segment;
      return segment
        .replace(ISSUE_REF, (_match, before, number) => `${before}[#${number}](${ISSUE_URL(number)})`)
        .replace(MENTION, (match, before, login) =>
          /[A-Za-z]/.test(login) ? `${before}[@${login}](${USER_URL(login)})` : match);
    })
    .join('');
}

/** Normalize line endings and trailing whitespace; drop a leading upstream H1. */
export function normalizeReleaseBody(body) {
  return `${String(body ?? '').replace(/\r\n/g, '\n').replace(/^#\s+.*\n+/, '').replace(/\s+$/, '')}\n`;
}

export function transformReleaseBody(body, vendored = new Set()) {
  return autolinkGitHubRefs(rewriteReleaseLinks(normalizeReleaseBody(body), vendored));
}

/** Vendored file for one release: curated front-matter + the transformed body. */
export function renderReleaseFile(release, vendored = new Set()) {
  const version = releaseVersion(release.tag_name);
  const date = String(release.published_at ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Release ${release.tag_name} has no usable published_at`);
  }
  const frontmatter = [
    '---',
    `version: '${version}'`,
    `tag: '${release.tag_name}'`,
    `date: ${date}`,
    `url: '${release.html_url}'`,
    ...(release.prerelease ? ['prerelease: true'] : []),
    '---',
    '',
  ].join('\n');
  return `${frontmatter}\n${transformReleaseBody(release.body, vendored)}`;
}

export function listVendoredReleases(dir = CHANGELOG_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name.replace(/\.md$/, ''))
    .sort(compareVersionsDesc);
}

/** The Reference slugs a release body may deep-link into on-site. */
export function vendoredReferenceSlugs() {
  return new Set(listLocalFlatReferences());
}
