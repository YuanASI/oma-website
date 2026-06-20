# Open Multi-Agent — Documentation & Marketing Site

The source for the [open-multi-agent](https://github.com/open-multi-agent/open-multi-agent) site, deployed at **[open-multi-agent.com](https://open-multi-agent.com)**. Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build): Starlight powers the **docs**, and custom Astro pages power the **landing page**, **blog**, **`/examples`**, and **`/showcase`**.

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
│   │   └── reference/             # vendored & auto-synced — see "Content model"
│   └── blog/                  # blog posts migrated from dev.to (Markdown)
├── content.config.ts          # `docs` + `blog` content collections
├── pages/
│   ├── index.astro            # landing page (renders a real OMA run + live repo stats)
│   ├── examples.astro         # /examples — build-time inventory of the framework's example suite
│   ├── showcase.astro         # /showcase — ecosystem / production-proof entries
│   └── blog/                  # blog index + per-post route
├── components/
│   ├── Nav.astro  Footer.astro    # shared chrome for the landing-style pages
│   └── ds/                        # design system: Badge Callout Card CodeBlock TaskNode
├── data/
│   └── hero-run.json          # the real task DAG the hero renders (see scripts/)
├── lib/
│   ├── site.ts                # site constants + build-time GitHub stats (ghStats)
│   ├── examples.ts            # build-time /examples inventory
│   └── showcase.ts            # ecosystem entries (landing + /showcase)
└── styles/                    # design tokens, Starlight theme, landing + blog CSS, code palette
scripts/                       # capture-hero-dag · migrate-devto-blog · sync-reference-docs
public/                        # favicon, logos, social card, robots.txt, _redirects, llms*.txt
astro.config.mjs               # site config, redirects, sidebar, sitemap, Expressive Code theme
```

## Content model

Two content collections live under `src/content/`, and they're maintained differently:

- **Docs** (`src/content/docs/`, rendered by Starlight):
  - **Getting Started + Guides** are written and edited directly in this repo.
  - **Reference** is **vendored from the framework repo's `docs/`** (baseline commit `ef31479`) and kept in step **automatically** (see [CI](#ci--contributing)). Treat these pages as a synced copy — fixes should land upstream in `open-multi-agent/open-multi-agent` first, then be re-vendored here, so the two don't drift.
- **Blog** (`src/content/blog/`, rendered by the custom pages in `src/pages/blog/`) — posts migrated from dev.to via [`scripts/migrate-devto-blog.mjs`](scripts/migrate-devto-blog.mjs). dev.to is the original; the site self-canonicals each post and links back to it.

Beyond the docs, the marketing pages are built from **live framework data at build time**, never a hand-maintained list:

- **Landing** ([`index.astro`](src/pages/index.astro)) renders a **real OMA run** ([`src/data/hero-run.json`](src/data/hero-run.json)) plus live repo stats.
- **`/examples`** mirrors the framework's example suite straight from its git tree.
- **`/showcase`** lists the ecosystem entries from [`src/lib/showcase.ts`](src/lib/showcase.ts).

The site navigation (sidebar order, grouping) is defined in [`astro.config.mjs`](astro.config.mjs).

## Scripts

These are run on demand or by CI — they're not part of `pnpm build`.

| Script | What it does |
| --- | --- |
| [`capture-hero-dag.mjs`](scripts/capture-hero-dag.mjs) | Reproduce the hero's real task DAG into `src/data/hero-run.json`. Re-run after an OMA release or a goal change. Runs outside this repo's dependency tree — see the header. |
| [`migrate-devto-blog.mjs`](scripts/migrate-devto-blog.mjs) | (Re-)migrate the dev.to posts into `src/content/blog/`. Idempotent overwrite. |
| [`sync-reference-docs.mjs`](scripts/sync-reference-docs.mjs) | Sync the vendored Reference docs from the framework's `main`. Run by CI weekly; also runnable locally. |

## Theming notes

- Design tokens are the single source of truth in `src/styles/tokens.css`, mapped onto Starlight in `src/styles/starlight-theme.css` (dark-first). Landing-style pages use `src/styles/landing.css`; the blog uses `src/styles/blog.css`.
- Code blocks use the OMA syntax palette defined in `src/styles/code-theme.mjs` (`omaDark` / `omaLight`).

> **Editing code-block colors?** Clear Astro's content-render cache before rebuilding: `rm -rf node_modules/.astro .astro`. That cache keys rendered code-block HTML on source content, not on `astro.config.mjs`, so a stale cache serves old styles after a palette change. Fresh CI checkouts have no cache, so production builds are unaffected.

## CI & contributing

Two GitHub Actions workflows back this repo:

- **Build** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) is the gate. It runs on every pull request and on pushes to `main`. `pnpm build` runs the build-time GitHub fetches (repo stats + the `/examples` inventory) and catches TypeScript, import, ESM, and content-collection errors. `GITHUB_TOKEN` authenticates those fetches so a shared-runner IP doesn't hit the rate limit, and a hard-coded fallback keeps CI green even if the API is unreachable.
- **Sync Reference docs** ([`.github/workflows/sync-reference.yml`](.github/workflows/sync-reference.yml)) runs weekly (Mon 06:17 UTC) and on demand. It re-vendors the Reference docs from the framework's `main`, validates the build, and **opens a PR** with any changes — it never pushes to `main`; the build CI plus a human review gate it.

Changes go through pull requests — please don't push directly to `main`.
