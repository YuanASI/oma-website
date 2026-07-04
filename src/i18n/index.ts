// Custom-page i18n (landing / examples / showcase / architecture). The Starlight
// docs have their own i18n (astro.config.mjs `locales`); this is the parallel,
// self-contained machinery for the hand-written .astro pages, which Starlight
// does not manage. English lives at the site root; other locales get a `/<key>/`
// URL prefix. Adding a locale = add it to `locales` + ship a dictionary; the page
// templates never fork.
import { en, type UiDict } from './en';
import { zh } from './zh';

export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// Per-locale metadata. `lang` is the BCP-47 tag (matches what Starlight emits for
// the docs: en / zh-CN); `ogLocale` is the Open Graph form; `label` is the full
// name, `short` the compact form for the in-nav language switcher.
export const localeMeta: Record<Locale, { lang: string; ogLocale: string; label: string; short: string }> = {
  en: { lang: 'en', ogLocale: 'en_US', label: 'English', short: 'EN' },
  zh: { lang: 'zh-CN', ogLocale: 'zh_CN', label: '简体中文', short: '中文' },
};

const dictionaries: Record<Locale, UiDict> = { en, zh };

export function useTranslations(locale: Locale): UiDict {
  return dictionaries[locale];
}

// `[...locale]` rest-param value → our Locale. The root route (param `undefined`)
// is the default locale; an unknown value also degrades to the default.
export function toLocale(param: string | undefined): Locale {
  return (locales as readonly string[]).includes(param ?? '') ? (param as Locale) : defaultLocale;
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'zh' : 'en';
}

// Shared by every `src/pages/[...locale]/*.astro` page: the default locale builds
// at the root (param `undefined` → no prefix), every other locale at `/<key>/`.
export function localeStaticPaths() {
  return locales.map((locale) => ({
    params: { locale: locale === defaultLocale ? undefined : locale },
  }));
}

// Prefix an in-site path with the locale segment. The default locale stays at the
// root; other locales get a `/<key>` prefix. Anchors and external URLs (anything
// not starting with a single `/path`) pass through untouched.
export function localizePath(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path;
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  if (path === '/') return `/${locale}/`;
  return `/${locale}${path}`;
}

// A blog post's collection id is its path under src/content/blog without the
// extension: en posts are flat (`goal-to-task-dag-coordinator`), zh translations
// live under `zh/` (`zh/goal-to-task-dag-coordinator`). The locale comes from the
// prefix; the trailing slug is shared by an en/zh pair, which is how the two are
// matched (hreflang, the "translated from" back-link, the language switcher).
export function blogLocaleOf(id: string): Locale {
  return id.startsWith('zh/') ? 'zh' : 'en';
}
export function blogSlugOf(id: string): string {
  return id.startsWith('zh/') ? id.slice('zh/'.length) : id;
}

// The custom pages that exist in every locale. The language switcher uses this to
// decide whether the current page has a same-page counterpart in the other locale
// (true for these; a route absent here falls back to the locale's home).
export const LOCALIZED_PATHS: readonly string[] = ['/', '/examples/', '/showcase/', '/architecture/', '/blog/', '/compare/'];

export type { UiDict };
