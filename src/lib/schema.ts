// Shared JSON-LD building blocks for Article-family structured data.
//
// The BlogPosting emitter (blog/[slug].astro) always carried author, publisher
// and dates because posts declare them in frontmatter. The TechArticle pages —
// every /compare, /solutions, /integrations page plus /architecture and
// /capabilities — carried none of them, so 110 pages shipped an Article subtype
// with no authorship and no freshness signal. These helpers give both emitters
// one definition of who wrote the page and who published it.
//
// Dates come from src/data/page-dates.json, derived from git history by
// scripts/page-dates.mjs (see the rationale there). A path absent from the
// snapshot yields no date fields at all — an omitted date is honest, a guessed
// one is not.

import pageDates from '../data/page-dates.json';

/**
 * Both fields present or both absent — a path is either in the snapshot or it
 * is not. Declared optional so call sites can read `.datePublished` directly
 * as well as spread the whole object into a JSON-LD literal.
 */
export type ArticleDates = { datePublished?: string; dateModified?: string };

/**
 * The person behind the writing. Same node the blog has always emitted, now
 * shared so the two emitters cannot drift apart.
 */
export const AUTHOR = {
  '@type': 'Person',
  name: 'Jack Chen',
  url: 'https://dev.to/jackchenme',
} as const;

/**
 * Publisher node. Takes `site` (Astro.site) so the logo and the `@id` resolve
 * against the deploy origin; the `@id` matches the Organization the homepage
 * declares, so every article points at that one entity instead of minting a
 * duplicate.
 */
export function publisher(site: URL | undefined) {
  return {
    '@type': 'Organization',
    '@id': new URL('/#organization', site).href,
    name: 'YuanASI',
    logo: new URL('/logo-mark-dark.svg', site).href,
  };
}

/**
 * Git-derived publish/modify dates for a programmatic page, as schema.org
 * date strings. Returns an empty object when the path is not in the snapshot,
 * so `{...articleDates(path)}` simply contributes nothing rather than emitting
 * a placeholder.
 *
 * `path` is the locale-independent page path (`/compare/langgraph/`), not the
 * localized URL — an en/zh pair is one entry in the data file and therefore
 * shares one revision history.
 */
export function articleDates(path: string): ArticleDates {
  const entry = (pageDates as Record<string, { published: string; modified: string }>)[path];
  if (!entry) return {};
  return {
    // Dates are day-resolution in git; schema.org accepts a plain ISO date.
    datePublished: entry.published,
    dateModified: entry.modified,
  };
}
