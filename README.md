# Open Multi-Agent — Documentation Site

The source for the [open-multi-agent](https://github.com/open-multi-agent/open-multi-agent) documentation, deployed at **[open-multi-agent.com](https://open-multi-agent.com)**. Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

> Looking for the framework itself, not the docs site? It lives in [`open-multi-agent/open-multi-agent`](https://github.com/open-multi-agent/open-multi-agent) and ships as [`@open-multi-agent/core`](https://www.npmjs.com/package/@open-multi-agent/core).

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

## Project structure

```
src/
├── content/
│   ├── docs/              # all documentation pages (Markdown)
│   │   ├── getting-started/   # maintained here
│   │   ├── guides/            # maintained here
│   │   └── reference/         # vendored — see "Content model" below
│   └── content.config.ts
├── pages/
│   └── index.astro        # the landing page
├── components/ds/         # landing-page design-system components
│   ├── Badge.astro  Callout.astro  Card.astro  CodeBlock.astro  TaskNode.astro
└── styles/                # OMA design tokens + Starlight theme + code palette
public/                    # favicon, logos, social card (served as-is)
astro.config.mjs           # site config, sidebar, Expressive Code theme
```

## Content model

Two kinds of docs live under `src/content/docs/`, and they're maintained differently:

- **Getting Started + Guides** are written and edited directly in this repo.
- **Reference** is **vendored from the framework repo's `docs/`** (baseline commit `ef31479`). Treat these pages as a synced copy — fixes should land upstream in `open-multi-agent/open-multi-agent` first, then be re-vendored here, so the two don't drift.

The site navigation (sidebar order, grouping) is defined in [`astro.config.mjs`](astro.config.mjs).

## Theming notes

- Design tokens are the single source of truth in `src/styles/tokens.css`, mapped onto Starlight in `src/styles/starlight-theme.css` (dark-first).
- Code blocks use the OMA syntax palette defined in `src/styles/code-theme.mjs` (`omaDark` / `omaLight`).

> **Editing code-block colors?** Clear Astro's content-render cache before rebuilding: `rm -rf node_modules/.astro .astro`. That cache keys rendered code-block HTML on source content, not on `astro.config.mjs`, so a stale cache serves old styles after a palette change. Fresh CI checkouts have no cache, so production builds are unaffected.

## CI & contributing

`pnpm build` is the gate. It runs on every pull request and on pushes to `main` ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)), and catches TypeScript, import, ESM, and content-collection errors. The build also fetches live GitHub stats with a hard-coded fallback, so API rate limits never fail CI.

Changes go through pull requests — please don't push directly to `main`.
