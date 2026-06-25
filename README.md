# Open Multi-Agent — Documentation & Marketing Site

The source for the [open-multi-agent](https://github.com/open-multi-agent/open-multi-agent) site, deployed at **[open-multi-agent.com](https://open-multi-agent.com)**. Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build): Starlight powers the **docs**, and custom Astro pages power the **landing page**, **`/examples`**, **`/showcase`**, **`/architecture`**, and the **blog**. The site is bilingual — **English at the root and Simplified Chinese under `/zh/`** (see [Internationalization](#internationalization)).

> Looking for the framework itself, not the site? It lives in [`open-multi-agent/open-multi-agent`](https://github.com/open-multi-agent/open-multi-agent) and ships as [`@open-multi-agent/core`](https://www.npmjs.com/package/@open-multi-agent/core).

## About open-multi-agent

TypeScript-native multi-agent orchestration. Give it a goal; a coordinator agent decomposes it into a task DAG, parallelizes the independent tasks, and synthesizes the result — three runtime dependencies, runs anywhere Node.js runs. It's **goal-first**: you describe the outcome and the coordinator builds the orchestration at runtime, instead of hand-wiring every node and edge up front.

```bash
npm create oma-app@latest      # scaffold a project and watch a run
npm install @open-multi-agent/core   # add it to an existing backend
```

The [Introduction](src/content/docs/getting-started/introduction.md) and [Quick Start](src/content/docs/getting-started/quick-start.md) in this repo are the canonical write-ups.

## Local development

Prerequisites: **Node.js 22** and **pnpm 10** (the versions CI builds with; a `pnpm-lock.yaml` is committed).

```bash
pnpm install        # install dependencies
pnpm dev            # local dev server at http://localhost:4321
pnpm build          # production build to ./dist/
pnpm preview        # preview the production build locally
```

`pnpm dev` gives you hot-reloading for content and components.

> **Working with the live-data pages?** The landing page and `/examples` fetch GitHub repo stats and the example inventory at build time. They work without any setup — a magnitude fallback keeps them populated — but a shared/unauthenticated IP can hit GitHub's rate limit, in which case they fall back to placeholder data. Set `GITHUB_TOKEN` to lift the limit and get exact numbers: `GITHUB_TOKEN=ghp_… pnpm build`.

## Project structure

```
src/
├── content/
│   ├── docs/                  # Starlight documentation pages (Markdown)
│   │   ├── getting-started/       # maintained here
│   │   ├── guides/                # maintained here
│   │   ├── reference/             # vendored & auto-synced — see "Content model"
│   │   └── zh/                    # Simplified Chinese docs (mirrors the English tree)
│   └── blog/                  # blog posts migrated from dev.to (English, flat)
│       └── zh/                    # Simplified Chinese translations (same filenames)
├── content.config.ts          # `docs` + `blog` content collections
├── pages/
│   ├── [...locale]/           # custom pages — one template per page → / and /zh/
│   │   ├── index.astro            # landing (real OMA run + live repo stats)
│   │   ├── examples.astro         # /examples — build-time inventory of the example suite
│   │   ├── showcase.astro         # /showcase — ecosystem / production-proof entries
│   │   ├── architecture.astro     # /architecture — how OMA works, diagrammed
│   │   └── blog/                  # blog index + per-post → /blog and /zh/blog
│   └── rss.xml.ts             # blog RSS feed (English posts)
├── i18n/                      # custom-page UI strings (Starlight handles the docs)
│   ├── index.ts               # locales + helpers (localizePath, useTranslations, …)
│   ├── en.ts                  # source of truth — UiDict = typeof en
│   └── zh.ts                  # Simplified Chinese — must match en key-for-key
├── layouts/
│   └── BaseLayout.astro       # shared locale-aware <head> for the custom pages
├── components/
│   ├── Nav · Footer · LangSwitcher · ThemeInit · StarlightHead
│   └── ds/                        # design system: Badge Callout Card CodeBlock TaskNode
├── data/
│   ├── hero-run.json          # the real task DAG the hero renders (English — see scripts/)
│   └── hero-run.zh.json       # the same, captured with a Chinese goal
├── lib/
│   ├── site.ts                # site constants + build-time GitHub stats (ghStats)
│   ├── examples.ts            # build-time /examples inventory
│   └── showcase.ts            # ecosystem entries (landing + /showcase)
└── styles/                    # tokens.css · starlight-theme.css · landing.css · blog.css · code-theme.mjs
scripts/                       # capture-hero-dag · migrate-devto-blog · sync-reference-docs · check-reference-drift · update-translation-manifest
public/                        # favicon, logos, social card, robots.txt, _redirects, llms*.txt
astro.config.mjs               # site config, locales (en + zh), redirects, sidebar, sitemap, Expressive Code theme
TRANSLATING.md                 # the spec for producing a translation
```

## Content model

Two content collections live under `src/content/`, and they're maintained differently:

- **Docs** (`src/content/docs/`, rendered by Starlight):
  - **Getting Started + Guides** are written and edited directly in this repo.
  - **Reference** is **vendored from the framework repo's `docs/`** (baseline commit `ef31479`) and kept in step **automatically** (see [CI](#ci--contributing)). Treat these pages as a synced copy — fixes should land upstream in `open-multi-agent/open-multi-agent` first, then be re-vendored here, so the two don't drift.
  - English lives at the root; each translation mirrors the tree under `src/content/docs/<locale>/` (e.g. `zh/`). See [Internationalization](#internationalization).
- **Blog** (English in `src/content/blog/`, Chinese translations in `src/content/blog/zh/`; rendered by `src/pages/[...locale]/blog/`) — posts migrated from dev.to via [`scripts/migrate-devto-blog.mjs`](scripts/migrate-devto-blog.mjs). dev.to is the original; the site self-canonicals each post. English posts link back to the dev.to original; Chinese translations omit `devtoUrl` and link back to the English post. See [Internationalization](#internationalization).

Beyond the docs, the marketing pages are built from **live framework data at build time**, never a hand-maintained list:

- **Landing** (`src/pages/[...locale]/index.astro`) renders a **real OMA run** ([`src/data/hero-run.json`](src/data/hero-run.json)) plus live repo stats.
- **`/examples`** mirrors the framework's example suite straight from its git tree.
- **`/showcase`** lists the ecosystem entries from [`src/lib/showcase.ts`](src/lib/showcase.ts).

The site navigation (sidebar order, grouping) is defined in [`astro.config.mjs`](astro.config.mjs).

## Internationalization

The site is bilingual — **English at the root (`/`)** and **Simplified Chinese under `/zh/`** — and built so more locales are a drop-in. [`TRANSLATING.md`](TRANSLATING.md) is the full spec; in short:

- **Docs** use Starlight's built-in i18n (`astro.config.mjs` → `locales`): English in `src/content/docs/`, translations under `src/content/docs/<locale>/`. Untranslated pages fall back to English automatically.
- **Custom pages** (landing / examples / showcase / architecture) aren't Starlight-managed. Each is **one template** at `src/pages/[...locale]/<page>.astro` that emits both `/` and `/zh/` via `getStaticPaths`. Their UI strings live in per-locale dictionaries under [`src/i18n/`](src/i18n/) — `en.ts` is the source of truth (`UiDict = typeof en`) and `zh.ts` must match it key-for-key — and [`BaseLayout.astro`](src/layouts/BaseLayout.astro) renders the locale-aware `<head>` (`lang`, `og:locale`, hreflang). A language switcher in the nav links between locales.
- **Blog** uses the same `[...locale]/blog/` routing: English posts in `src/content/blog/`, Chinese in `src/content/blog/zh/` (same filename). A post appears under `/zh/blog` only once translated, and the en↔zh `hreflang` pair is emitted only when both sides exist.
- **Adding a locale** (e.g. `ja`): uncomment it in `astro.config.mjs` → `locales`, add a `src/i18n/ja.ts` dictionary, and a `src/content/docs/ja/` tree. The page templates never fork.
- **The hero stays a real run** in every locale — `src/data/hero-run.<locale>.json` is captured with a goal *in that language* (`OMA_LANG=zh node scripts/capture-hero-dag.mjs`), never hand-translated.
- **Reference drift:** the Reference docs are auto-vendored in English, so their translations can silently go stale. [`scripts/check-reference-drift.mjs`](scripts/check-reference-drift.mjs) flags pages whose English source changed since they were translated; [`scripts/update-translation-manifest.mjs`](scripts/update-translation-manifest.mjs) re-baselines a page after it's re-translated.

> **Heads up:** `astro build` transpiles with esbuild and does **not** type-check, so a missing `zh.ts` key won't fail the build — it renders as `undefined`. Verify a translation against the rendered output (e.g. `grep -rc undefined dist/zh`), not just a green build.

## Scripts

These are run on demand or by CI — they're not part of `pnpm build`.

| Script | What it does |
| --- | --- |
| [`capture-hero-dag.mjs`](scripts/capture-hero-dag.mjs) | Reproduce the hero's real task DAG into `src/data/hero-run.json`. `OMA_LANG=zh` captures a Chinese-goal run into `hero-run.zh.json`. Re-run after an OMA release or a goal change. Runs outside this repo's dependency tree — see the header. |
| [`migrate-devto-blog.mjs`](scripts/migrate-devto-blog.mjs) | (Re-)migrate the dev.to posts into `src/content/blog/`. Idempotent overwrite. |
| [`sync-reference-docs.mjs`](scripts/sync-reference-docs.mjs) | Sync the vendored Reference docs from the framework's `main`. Run by CI weekly; also runnable locally. |
| [`check-reference-drift.mjs`](scripts/check-reference-drift.mjs) | Report Reference translations whose English source changed since they were translated. Read-only; run after a Reference sync. |
| [`update-translation-manifest.mjs`](scripts/update-translation-manifest.mjs) | Re-baseline a Reference page's translation manifest entry once it's been re-translated. |

## Theming notes

- Design tokens are the single source of truth in `src/styles/tokens.css`, mapped onto Starlight in `src/styles/starlight-theme.css` (dark-first). Landing-style pages use `src/styles/landing.css`; the blog uses `src/styles/blog.css`. The CJK font stack (for the `/zh/` pages) is appended in `tokens.css`, so English pages are unchanged.
- Code blocks use the OMA syntax palette defined in `src/styles/code-theme.mjs` (`omaDark` / `omaLight`).

> **Editing code-block colors?** Clear Astro's content-render cache before rebuilding: `rm -rf node_modules/.astro .astro`. That cache keys rendered code-block HTML on source content, not on `astro.config.mjs`, so a stale cache serves old styles after a palette change. Fresh CI checkouts have no cache, so production builds are unaffected.

## CI & contributing

Two GitHub Actions workflows back this repo:

- **Build** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) is the gate. It runs on every pull request and on pushes to `main`. `pnpm build` runs the build-time GitHub fetches (repo stats + the `/examples` inventory) and catches import, ESM, and content-collection errors. `GITHUB_TOKEN` authenticates those fetches so a shared-runner IP doesn't hit the rate limit, and a hard-coded fallback keeps CI green even if the API is unreachable. Note that the build transpiles with esbuild and does **not** type-check (see the i18n heads-up above).
- **Sync Reference docs** ([`.github/workflows/sync-reference.yml`](.github/workflows/sync-reference.yml)) runs weekly (Mon 06:17 UTC) and on demand. It re-vendors the Reference docs from the framework's `main`, validates the build, and **opens a PR** with any changes (and a translation-drift report) — it never pushes to `main`; the build CI plus a human review gate it.

Changes go through pull requests — please don't push directly to `main`.
