# Open Multi-Agent Website

[English](README.md) | [简体中文](README.zh-CN.md)

The official website and documentation hub for [Open Multi-Agent](https://github.com/open-multi-agent/open-multi-agent), a self-hosted TypeScript runtime for building and operating multi-agent systems.

[Live site](https://open-multi-agent.com/) · [中文站点](https://open-multi-agent.com/zh/) · [Documentation](https://open-multi-agent.com/getting-started/) · [Examples](https://open-multi-agent.com/examples/) · [Framework repository](https://github.com/open-multi-agent/open-multi-agent) · [npm](https://www.npmjs.com/package/@open-multi-agent/core)

> This repository contains the website, not the framework runtime. Framework code and its canonical API documentation live in [`open-multi-agent/open-multi-agent`](https://github.com/open-multi-agent/open-multi-agent).

## What is in this repository

This statically generated site brings the product, learning path, and technical reference into one bilingual experience:

- Product, capabilities, architecture, solutions, integrations, comparisons, and showcase pages
- Getting Started and production-oriented guides maintained in this repository
- Framework Reference documentation synchronized from published framework releases
- Browsable TypeScript examples backed by committed, commit-pinned source snapshots
- A changelog synchronized from GitHub Releases
- English and Simplified Chinese routes, metadata, canonical URLs, and `hreflang`
- Blog, RSS, sitemap, structured data, `llms.txt`, and IndexNow support
- A landing-page task DAG replayed from captured Open Multi-Agent runs

English is served at `/`; Simplified Chinese is served at `/zh/`.

## Technology

- [Astro 7](https://astro.build/) for static generation and custom pages
- [Starlight](https://starlight.astro.build/) for documentation
- TypeScript and Astro content collections for site code and content contracts
- Shared design tokens with light and dark themes
- GitHub Actions for CI, snapshot refreshes, Reference sync, release sync, and search-index submission
- Cloudflare Pages for production hosting

## Local development

Requirements: Node.js 22 and the pnpm version pinned in [`package.json`](package.json).

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The development server runs at [http://localhost:4321](http://localhost:4321).

Run the project gates before submitting a change:

```bash
pnpm check
pnpm build
```

Preview the production build with `pnpm preview`.

Normal local builds do not require a GitHub token. Pages consume committed snapshots for repository statistics, npm downloads, and the examples catalog, so transient upstream API failures do not determine whether the site builds.

## Repository map

```text
src/
├── components/          Shared site, Starlight, and design-system components
├── content/
│   ├── blog/            English posts and Simplified Chinese translations
│   ├── changelog/       Release notes synchronized from GitHub Releases
│   └── docs/            Getting Started, Guides, and synchronized Reference docs
├── data/                Captured runs and committed external-data snapshots
├── i18n/                Typed UI dictionaries and locale helpers
├── layouts/             Shared custom-page layout and metadata
├── lib/                 Route data, schemas, SEO helpers, and content loaders
├── pages/               Localized custom routes, RSS, and the 404 page
└── styles/              Design tokens and page themes
scripts/                 Validation, synchronization, migration, and capture tools
public/                  Static assets, redirects, crawler files, and media
.github/workflows/       CI and scheduled synchronization workflows
```

## Content ownership and synchronization

- `src/content/docs/getting-started/` and `src/content/docs/guides/` are authored here.
- `src/content/docs/reference/` is vendored from the framework repository. Correct substantive errors upstream, then run the Reference sync workflow.
- `src/content/changelog/` is sourced from published GitHub Releases. Correct release bodies upstream rather than editing the vendored files directly.
- `src/data/gh-stats.json`, `src/data/examples.json`, and `src/data/examples-source.json` are refreshed by scheduled automation and committed as validated snapshots.
- `src/data/hero-run.json` and `src/data/hero-run.zh.json` are captured runs. Localized captures must be regenerated, not hand-translated.
- `src/i18n/en.ts` is the UI dictionary source of truth; `src/i18n/zh.ts` must remain key-for-key compatible.

See [`TRANSLATING.md`](TRANSLATING.md) for translation conventions and [`ATTRIBUTION.md`](ATTRIBUTION.md) before adding or changing links to this site from external channels.

## Validation and automation

`pnpm check` validates locale parity, captured-run schemas and replay, synchronization contracts, examples information architecture, Reference navigation, page dates, reading times, version drift, and attribution rules. `pnpm build` validates the complete static output.

Scheduled workflows refresh data snapshots every six hours, synchronize Reference docs weekly, synchronize release notes daily, and submit the deployed sitemap to IndexNow after changes reach `main`. Generated updates are proposed through pull requests and validated before they reach the production branch.

## Contributing

Contributions that improve correctness, clarity, accessibility, performance, or the learning path are welcome. Keep English and Chinese changes aligned, respect the upstream ownership boundaries above, and run the checks required for the files you changed. Security issues should follow [`SECURITY.md`](SECURITY.md).

## Related projects

- [`open-multi-agent/open-multi-agent`](https://github.com/open-multi-agent/open-multi-agent) — framework runtime and canonical API source
- [`@open-multi-agent/core`](https://www.npmjs.com/package/@open-multi-agent/core) — published npm package
- [`open-multi-agent/oma-forge`](https://github.com/open-multi-agent/oma-forge) — ecosystem forge

## License

Except for the identified exceptions below, original work in this repository is licensed under the [Apache License 2.0](LICENSE).

- Website code, scripts, configuration, workflows, original documentation, site copy, and original media: [Apache License 2.0](LICENSE)
- Blog prose and original non-code media under `src/content/blog/**`: Copyright (c) 2026 Jack Chen. All rights reserved. Code examples and excerpts remain Apache-2.0. See [`CONTENT-LICENSE.md`](CONTENT-LICENSE.md).
- Synchronized framework Reference documentation: [MIT License](REFERENCE-LICENSE.md)

Third-party materials and trademarks remain subject to their own terms.
