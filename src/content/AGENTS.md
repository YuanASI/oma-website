# AGENTS.md — `src/content/`

Applies to the content collections under this directory. The root `AGENTS.md`
still applies.

Keep this file and `CLAUDE.md` at this level: `docs/` and `changelog/` are
content collections, so a Markdown file placed inside them is loaded as content.

## `docs/reference/`

`docs/reference/` is synchronized from the framework repository. Do not directly
edit its substantive content: make the change upstream and then run the
reference sync workflow.

The sync discovers every top-level upstream `docs/*.md` file except the explicit
`EXCLUDE` set in `scripts/reference-sync-lib.mjs`. A newly discovered document
or directory must fail the discovery gate until it is either integrated with
front-matter, sidebar placement, and translation, or deliberately excluded.

## `changelog/`

`changelog/` holds vendored release notes, one file per published framework
release, synchronized from the framework's GitHub releases by the
`sync-releases` workflow. Do not edit a release body here: correct the release
upstream and re-run the sync. The releases — not upstream `CHANGELOG.md`, which
keeps only the most recent versions — are the source, and the sync is additive,
so this directory is the complete archive. Release bodies stay in English on
every locale; only `/changelog` chrome is translated.
