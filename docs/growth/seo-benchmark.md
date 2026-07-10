# SEO / GEO Growth Playbook

> In-repo growth doc. Encodes the competitive SEO benchmark against **open-design**
> and the concrete, repeatable playbook for adding search-optimized pages to this
> site. Companion to the external PRD §4.6 (GEO) — this is the committed, actionable
> slice that lives with the code.

## Why this exists

The site's on-page SEO/GEO foundation is already mature (see "Where we stand").
What's missing is **scale of intent-targeted pages**, **content velocity**, and
**off-page automation**. This doc records the benchmark that motivated the work and
the recipe so future page additions stay consistent instead of re-deriving the
pattern each time.

## Benchmark: how open-design.ai does SEO

Read from the `nexu-io/open-design` repo source (`apps/landing-page`, July 2026).
Their marketing site is **Astro 6 static + Cloudflare Pages — the same stack as
ours**, so the *method* ports directly. Four layers:

1. **Technical foundation** — `@astrojs/sitemap` heavily tuned (per-type
   priority/changefreq, blog `lastmod` from frontmatter, filtered to canonical
   URLs); a single `SeoHead` component (canonical / OG / Twitter / hreflang +
   `x-default` / JSON-LD Article+WebSite+Blog); `robots.txt` + `llms.txt`;
   staging `noindex` to avoid duplicate indexing.
2. **Programmatic pages at scale** (their core weapon) — `/agents/{22}-design/` +
   `/solutions/{20}/` + `/alternatives/{12}/`, each × 14 locales ≈ their
   self-reported "~500 routes × 14 locales". One authored page + `getStaticPaths`
   over the locale list emits every localized URL.
3. **Content growth loop** — ~30 keyword blog posts ("X alternatives", category
   terms) + ~45 "longform tutorial" pages sourced from community YouTube videos via
   a daily cron → relevance-gated → human-approved → generated → PR pipeline.
4. **Off-page automation** (CI) — IndexNow push to Bing/Yandex, Google Search
   Console API monitoring, a blog SEO lint gate, sitemap ping.

## Where we stand (gap)

- **Foundation — at parity or better.** `public/robots.txt` has an explicit
  AI-crawler allowlist (GPTBot / ClaudeBot / PerplexityBot / …); `public/llms.txt`
  + `llms-full.txt`; `BaseLayout.astro` + `StarlightHead.astro` emit canonical /
  hreflang (en / zh-CN / x-default) / OG / Twitter / JSON-LD. No work needed here.
- **Programmatic pages — the big gap.** We have 4 `/compare/*` pages and nothing
  else. No `/solutions/`, no `/integrations/`.
- **Content velocity — thin.** 8 blog posts, no growth loop.
- **Off-page automation — none.** Sitemap was untuned (`sitemap()`); no IndexNow,
  no GSC.

## Strategy: port the method, not the page count

OMA is a **developer framework**, not a consumer design app. Search volume is far
smaller and a developer audience punishes thin / AI-farm pages. Every `/compare/*`
cell is a **primary-source-verified** technical claim (see the HONESTY DISCIPLINE
header in `src/lib/compare.ts`), so the bottleneck for expansion is **fact
verification, not code**. Therefore:

- **Quality-first, sourced, moderate page count** — not a 500-page farm.
- Keep **two locales** (en `/`, zh `/zh/`); do not expand locales for SEO.
- Adapt the taxonomy to our positioning: framework **comparisons**, use-case
  **solutions**, provider **integrations** — not design-tool "alternatives".

## The recipe: add a data-driven, bilingual, SEO page type

Copy the existing `/compare/*` pair — **no new infrastructure**:

1. **Data** — `src/lib/<type>.ts`: reuse `type Loc = { en; zh }` from `compare.ts`;
   bilingual facts/prose go inline as `Loc`, slug/name/keywords/repo as `string`;
   export `ITEMS` + `getBySlug()`.
2. **Detail route** — `src/pages/[...locale]/<type>/[slug].astro`: copy
   `compare/[competitor].astro`. `getStaticPaths` emits the `locale × item`
   cross-product; reuse the `locale / t / L / pick / withName` helper block; set
   `path = /<type>/${item.slug}/`; render inside `BaseLayout` + `Nav` + `Footer`.
3. **Hub route** — `src/pages/[...locale]/<type>/index.astro`: copy
   `compare/index.astro`; `getStaticPaths(){ return localeStaticPaths() }`;
   `CollectionPage` → `ItemList` JSON-LD.
4. **i18n chrome** — add a `<type>` namespace to **both** `src/i18n/en.ts` and
   `zh.ts`, key-for-key (`{name}` placeholders + manual `.replace()`).
5. **Register** — add `'/<type>/'` to `LOCALIZED_PATHS` in `src/i18n/index.ts`.
6. **Nav/Footer** — extend `Nav.astro`'s `current` union + add a link; add
   `nav.<type>` (+ `menuDesc`) to both dicts.

Sitemap inclusion, hreflang/canonical/OG/JSON-LD, analytics, and locale routing
all come along for free once the routes exist and pass `path`.

> **CI gotcha:** `astro build` uses esbuild and does **not** type-check. A missing
> zh key ships silently as `undefined`. Key parity is enforced only by
> `pnpm check` (`tsc -p tsconfig.i18n.json`). Every new namespace must be added to
> en.ts **and** zh.ts. Verify with `grep -rc undefined dist/zh`.

## Sitemap tuning (implemented)

`astro.config.mjs` → `sitemap({ serialize })`: homepage `1.0`/daily, `/blog/`
`0.9`/daily, blog posts `0.8`/weekly + `lastmod`, `/compare|/solutions|
/integrations/` hubs `0.8`/weekly, their detail pages `0.7`/weekly, docs `0.6`,
`/examples|/showcase|/architecture/` `0.6`, everything else `0.5`. Blog `lastmod`
is read from `pubDate`/`updatedDate` frontmatter at config time; zh pages inherit
their English counterpart's weight.

## Roadmap

| Phase | Track | State |
|---|---|---|
| 0 | This doc | done |
| 2 | Sitemap per-type tuning | done |
| 2 | IndexNow Action (Bing/Yandex) — outward-facing, needs sign-off | planned |
| 1 | Expand `/compare/*` — TS-native (Mastra, Vercel AI SDK, VoltAgent, Inngest AgentKit) | planned |
| 1 | Expand `/compare/*` — Python majors (LangChain, LlamaIndex, Pydantic AI, Google ADK, Semantic Kernel) | planned |
| 3 | New `/solutions/*` use-case pages (anchored to blog) | planned |
| 4 | New `/integrations/*` provider pages (real code per provider) | planned |
| — | Keyword blog cadence ("X alternative" + category terms) | ongoing |

## Guardrails

- **Fact-check** every `/compare` + `/integrations` technical claim against a
  primary source (framework's own `pyproject.toml`/`package.json`/docs, npm/PyPI).
  Never invent a number; state qualitatively when unsure. This gates velocity.
- **i18n key parity** — every new dict namespace in both `en.ts` and `zh.ts`.
- **Never edit vendored Reference** (`src/content/docs/reference/`) — it re-syncs
  from the framework repo.
- **Numbers stay live** — stars/forks via `ghStats()` build-time fetch + magnitude
  fallback; never hardcode.
