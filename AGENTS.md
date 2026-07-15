# AGENTS.md

Repository instructions for coding agents and automated contributors. These
instructions apply to the entire repository unless a more specific `AGENTS.md`
exists in a subdirectory.

## Project scope

This repository is the documentation and marketing site for Open Multi-Agent,
deployed at `open-multi-agent.com`. It is not the framework repository. Framework
changes belong in `open-multi-agent/open-multi-agent`, which publishes
`@open-multi-agent/core`.

The site uses Astro 6 and Starlight:

- Starlight renders the documentation.
- Custom Astro pages render the landing page, examples, showcase, architecture,
  solutions, integrations, comparisons, and blog.
- English is served at `/`; Simplified Chinese is served at `/zh/`.

## Environment and commands

Use Node.js 22 and the pnpm version pinned in `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm dev       # local server at http://localhost:4321
pnpm check     # TypeScript/i18n key-parity check
pnpm build     # production build in dist/
pnpm preview   # preview the production build
```

Do not substitute npm or yarn or regenerate the lockfile unless the task
explicitly requires a dependency change.

## Architecture map

- `astro.config.mjs`: Starlight, locales, redirects, sidebar, sitemap, and code
  theme configuration.
- `src/pages/[...locale]/`: locale-aware custom page templates. One template
  must generate both English and Chinese routes.
- `src/content/docs/`: English documentation maintained in this repository.
- `src/content/docs/zh/`: Simplified Chinese documentation.
- `src/content/docs/reference/`: vendored framework reference documentation;
  see the editing boundary below.
- `src/content/blog/` and `src/content/blog/zh/`: English and Chinese blog posts.
- `src/i18n/`: strings and routing helpers for custom pages. `en.ts` is the
  source of truth; `zh.ts` must remain key-for-key compatible.
- `src/layouts/BaseLayout.astro`: locale-aware metadata, canonical URLs,
  hreflang, Open Graph metadata, and JSON-LD for custom pages.
- `src/styles/tokens.css`: design-token source of truth.
- `src/lib/`: site constants and build-time data loaders.
- `src/data/hero-run*.json`: captured real OMA runs used by the landing page.
- `scripts/`: content sync, translation drift, migration, and hero capture tools.
- `TRANSLATING.md`: translation terminology and workflow requirements.

## Working rules

### Keep changes in the correct repository

Do not add framework runtime code here. If a site change depends on a framework
change, identify the upstream work separately rather than duplicating framework
logic in this repository.

### Respect content ownership

`src/content/docs/reference/` is synchronized from the framework repository.
Do not directly edit its substantive content: make the change upstream and then
run the reference sync workflow. Getting Started and Guides are maintained here
and may be edited directly.

### Preserve the i18n architecture

- Keep English at `/` and Chinese at `/zh/`.
- For custom pages, add user-facing strings to `src/i18n/en.ts` and
  `src/i18n/zh.ts`; do not fork separate `zh` page templates.
- Follow `TRANSLATING.md` for terminology and text that must remain unchanged.
- Keep localized metadata, canonical URLs, and hreflang behavior intact.
- A localized hero run must be captured with the corresponding language through
  `scripts/capture-hero-dag.mjs`; do not hand-translate captured run JSON.

### Keep live data live

Repository statistics and the examples inventory are refreshed by the scheduled
`refresh-gh-data` workflow and committed as snapshots under `src/data/`. Normal
builds consume those snapshots; the landing page may additionally refresh stars
and forks in the browser. Do not hard-code exact stars, forks, contributors, or
example counts as durable claims. Preserve the snapshot validation and graceful
fallbacks for GitHub API failures, rate limits, or stale data.

`GITHUB_TOKEN` is needed only when deliberately running a script or workflow that
refreshes data from GitHub; normal local builds do not require it. Never commit,
print, or expose a token.

### Follow existing design and content patterns

- Reuse existing components and design tokens before adding new abstractions.
- Put shared visual values in `src/styles/tokens.css` rather than scattering
  literals across components.
- Keep Astro components server-rendered by default; add client-side JavaScript
  only when the interaction requires it.
- Preserve accessibility, responsive behavior, semantic HTML, and light/dark
  theme support.
- Avoid unrelated reformatting or generated-file churn.

## Verification

Run the smallest checks that cover the change, and report any check that could
not be run.

| Change | Required verification |
| --- | --- |
| Documentation or blog content | `pnpm build` |
| Locale dictionary or localized custom page | `pnpm check`, `pnpm build`, and verify no rendered `undefined` appears under `dist/zh` |
| Astro component, page, layout, config, or data loader | `pnpm check` and `pnpm build` |
| CSS or visual change | `pnpm build` plus browser review at relevant desktop and mobile widths in both themes |
| Reference sync or translation update | Relevant script checks, `pnpm check`, and `pnpm build` |

If code-block colors change, clear Astro's local rendering caches before the
final build (`node_modules/.astro` and `.astro`) so stale highlighted markup does
not mask the result. Move files to the system trash instead of permanently
deleting them unless permanent deletion was explicitly authorized.

## Git and external actions

- Inspect the current Git state before editing; automated worktrees may use a
  detached `HEAD`.
- Do not overwrite unrelated user changes.
- Do not push, deploy, publish, open or update pull requests, or modify other
  external systems unless the user explicitly requests that action.
- Do not push directly to `main` or another default branch unless the user
  explicitly requests it.
- Keep commits focused and describe the verification performed.

## Source-of-truth priority

When instructions or documentation disagree, prefer current executable project
configuration (`package.json`, workflows, and source code), then this file, then
`README.md` and topic-specific documentation. `AGENTS.md` is the single
tool-neutral source of repository instructions.
