# Translating the docs

This site is multilingual via Starlight's built-in i18n. English is the source
of truth at the site root; each translation lives under a locale folder. This
file is the spec for producing a translation — it is written so a model (or a
person) can follow it mechanically.

Configured locales (`astro.config.mjs` → `locales`):

| Locale | `lang` (BCP-47) | Content directory      | URL prefix |
| ------ | --------------- | ---------------------- | ---------- |
| root   | `en`            | `src/content/docs/`    | (none)     |
| zh     | `zh-CN`         | `src/content/docs/zh/` | `/zh/`     |

To add a language later: add the locale to `astro.config.mjs` and mirror the
tree under `src/content/docs/<key>/`. No code changes — the page templates never
fork.

## What to produce

For each English page `src/content/docs/<path>`, produce
`src/content/docs/<locale>/<path>` — **same filename, same folder structure**,
just one extra `<locale>/` level (e.g. `getting-started/quick-start.md` →
`zh/getting-started/quick-start.md`). Mirror the English file 1:1: translate the
human-readable text, leave everything else byte-for-byte.

An untranslated page is **not** an error — Starlight falls back to the English
page automatically (with a small "not translated" notice). Translate
incrementally, one page at a time.

## Blog posts

The blog follows the same rules with one wrinkle. For each English post
`src/content/blog/<slug>.md`, produce `src/content/blog/zh/<slug>.md` — **same
filename**, one extra `zh/` level (mirrors the docs convention above). Translate
the `title`/`description` values and the body; keep code, identifiers, and URLs
verbatim; prefix in-site links with the locale.

Two blog-specific points:

- **Omit the `devtoUrl` front-matter field.** It's the dev.to back-link for the
  English original, which a translation doesn't have — the zh post instead shows
  an "阅读英文原文" link back to the English post automatically.
- Keep `pubDate`, `tags` (English), and `readingMinutes` unchanged.

Unlike the Starlight docs, the blog has no English fallback: an untranslated
post simply does not appear under `/zh/blog/` until its `zh/` file exists.

## Translate these

- Body prose, headings, list items, blockquote text.
- Human-language cells in tables (not the `|---|` separator row).
- The **values** of the `title:` and `description:` front-matter fields.
- The bracket title and inner lines of asides (`:::note[Title]`).

## Keep verbatim — do NOT translate

- **Front-matter keys** (`title:`, `description:`, …) and the YAML quoting/structure. Only values change.
- **Fenced code blocks** (```` ``` ````) — the entire block, **including comments**. A translated `// comment` makes the API example un-searchable.
- **Inline code** in backticks — identifiers like `runTeam`, `MemoryStore`, `restore()`.
- **Aside markers** — the `:::`, the type keyword (`note` / `tip` / `caution` / `danger`), and the closing `:::`. Only the `[Title]` and the inner text get translated.
- **ASCII diagrams / box drawings** inside code fences — keep the whole block in English. CJK glyphs are double-width and would break the box alignment.
- **Table separator rows** (`|---|---|`), HTML entities, and inline `{ }` expressions.
- File names — never rename a file.

## Internal links → add the locale prefix

Starlight does **not** auto-rewrite link URLs in page content. To keep the
reader inside the translated tree, prefix internal doc links with the locale:

```
English:  [Quick Start](/getting-started/quick-start/)
zh:       [快速开始](/zh/getting-started/quick-start/)
```

Translate the link **text**; rewrite the **path** by inserting the locale key
after the leading `/`. A `/zh/…` link always resolves — it serves the translated
page if it exists, else the English fallback. External URLs (`https://…`) are
left unchanged.

## Encoding

UTF-8, no BOM. Do not add or remove front-matter fields.

## Worked example

`src/content/docs/zh/getting-started/introduction.md` is the reference
translation of `src/content/docs/getting-started/introduction.md`. It exercises
every rule above — front-matter, an aside, a table, a fenced code block, an
ASCII diagram, and internal links. Match its style.

## Docs pages have a drift guard — update it after translating

The Reference section (`reference/**`) is **vendored** from the framework repo
and re-synced weekly (`.github/workflows/sync-reference.yml`). The sync discovers
top-level upstream Markdown files, skips only the explicit exclusion set, and
fails when a new page or directory needs an integration decision; it never
silently creates an untranslated page. After you translate or re-translate a
reference page, record the English baseline it was translated from, so the drift
checker knows the translation is current. The same guard covers the hand-written
Getting Started and Guides sections, where ordinary PRs can also change English
without updating the matching Chinese page:

```
node scripts/update-translation-manifest.mjs reference/<slug>
# e.g.  node scripts/update-translation-manifest.mjs reference/cli
# e.g.  node scripts/update-translation-manifest.mjs getting-started/quick-start
```

This stamps `scripts/reference-translation-manifest.json` with the hash of the
English body. `ci.yml` runs the checker on ordinary PRs as a soft signal, while
the weekly Reference sync also comments on its generated PR when the `zh/` copy
is **stale**. Re-translate and re-run the command above to refresh the baseline.
