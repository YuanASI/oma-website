# AGENTS.md

Repository instructions for coding agents and automated contributors. These
instructions apply to the entire repository unless a more specific `AGENTS.md`
exists in a subdirectory.

Directory-specific rules live next to the files they govern. Read the matching
file before editing there:

- `src/content/AGENTS.md`: the vendored reference docs and changelog.
- `src/i18n/AGENTS.md`: custom-page strings and dictionary parity.
- `src/data/AGENTS.md`: GitHub snapshots, hero runs, and `GITHUB_TOKEN`.

## Project scope

This repository is the documentation and marketing site for Open Multi-Agent,
deployed at `open-multi-agent.com`. It is not the framework repository. Framework
changes belong in `open-multi-agent/open-multi-agent`, which publishes
`@open-multi-agent/core`.

The site uses Astro and Starlight (versions are pinned in `package.json`):

- Starlight renders the documentation.
- Custom Astro pages render the landing page, examples, showcase, architecture,
  solutions, integrations, comparisons, and blog.
- English is served at `/`; Simplified Chinese is served at `/zh/`.

## Environment and commands

Use Node.js 22 and the pnpm version pinned in `package.json`. Install with
`pnpm install --frozen-lockfile`; the available commands are the `package.json`
scripts.

Do not substitute npm or yarn or regenerate the lockfile unless the task
explicitly requires a dependency change.

## Layout constraints

- `src/pages/[...locale]/`: locale-aware custom page templates. One template
  must generate both English and Chinese routes.
- `src/content/docs/reference/` and `src/content/changelog/` are vendored from
  the framework repository; see `src/content/AGENTS.md` before touching them.
- Do not place `AGENTS.md`, `CLAUDE.md`, or other notes inside `src/pages/`,
  `public/`, or a content collection directory: they would be routed, published,
  or loaded as content.

## Working rules

### Keep changes in the correct repository

Do not add framework runtime code here. If a site change depends on a framework
change, identify the upstream work separately rather than duplicating framework
logic in this repository.

### Respect content ownership

`src/content/docs/reference/` and `src/content/changelog/` are synchronized from
the framework repository; their editing boundary is in `src/content/AGENTS.md`.
Getting Started and Guides are maintained here and may be edited directly.

### Keep documentation activation-focused

Marketing pages acquire interest; the documentation layer moves users from
activation to mastery: explain the mental model in 60 seconds, run an example in
5 minutes, and make every capability findable and configurable. Competitive
comparisons belong under `/compare/`, not in documentation body content.

### Preserve the i18n architecture

- Keep English at `/` and Chinese at `/zh/`.
- For custom pages, user-facing strings go through `src/i18n/` (see
  `src/i18n/AGENTS.md`); do not fork separate `zh` page templates.
- Follow `TRANSLATING.md` for terminology and text that must remain unchanged.
- Keep localized metadata, canonical URLs, and hreflang behavior intact.
- Localized hero runs are captured, never hand-translated; see
  `src/data/AGENTS.md`.

### Tag outbound links from the registry

`ATTRIBUTION.md` is the source of truth for which `utm_source` and `utm_medium`
values exist and what each one means. Consult it before adding or changing any
link that points at the site from outside it — including links that live in
other repositories, in GitHub's own link fields, or anywhere else off this
site. Reusing a value that already means something else, or coining a synonym
for one that exists, is what stops the dashboard telling channels apart, and it
cannot be repaired after the fact.

Never put campaign parameters on a link between pages of this site: an internal
link carrying them is recorded as a fresh external arrival.

Short links belong to positions that render a link as the URL itself; a link
with anchor text carries the canonical URL instead. `ATTRIBUTION.md` explains
the distinction and how to verify a redirect, which no build check covers.
`public/_redirects` holds the Cloudflare Pages edge redirects, including those
short links; it is copied verbatim at build time, so the build never reads it.

Add a short link with `pnpm add:channel` rather than editing the two files by
hand — it writes both, in both spellings a rule needs. `pnpm check:attribution`
(part of `pnpm check`) fails on a value that is not registered, a link present
in one file but not the other, a rule that is not a 302, or a rule missing one
of its two spellings.

### Keep live data live

Do not hard-code exact stars, forks, contributors, or example counts as durable
claims. They come from refreshed snapshots under `src/data/`; see
`src/data/AGENTS.md`.

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
- You may create a branch, commit, push the feature branch, and open or update
  a pull request without asking.
- Do not push directly to `main` or another default branch unless the user
  explicitly requests it.
- Merging to `main` is a production release: Cloudflare Pages builds and deploys
  `open-multi-agent.com` from every push to `main`, and the IndexNow workflow
  then submits the sitemap. Because a merge ships to production, merging needs
  the user's explicit approval for that pull request each time: once its required
  verification and CI have passed, ask before squash-merging. Do not enable
  GitHub auto-merge. (Decided 2026-11-13.)
- SUPERSEDED 2026-11-13, kept for history: "Squash-merge a pull request only
  after its required verification and CI have passed." That wording allowed
  merging without asking once checks passed; merges now need approval each time
  (see the previous item).
- Do not deploy by any other route (Wrangler, the Cloudflare dashboard, manually
  dispatched workflows), publish, or modify other external systems unless the
  user explicitly requests that action.
- Keep commits focused and describe the verification performed.

## Source-of-truth priority

When instructions or documentation disagree, prefer current executable project
configuration (`package.json`, workflows, and source code), then this file, then
`README.md` and topic-specific documentation. `AGENTS.md` is the single
tool-neutral source of repository instructions.
