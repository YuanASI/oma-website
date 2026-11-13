# AGENTS.md — `src/data/`

Applies to the committed data snapshots in this directory. The root `AGENTS.md`
still applies.

## GitHub snapshots

Repository statistics and the examples inventory are refreshed by the scheduled
`refresh-gh-data` workflow and committed as snapshots here. Normal builds
consume those snapshots; the landing page may additionally refresh stars and
forks in the browser. Do not hard-code exact stars, forks, contributors, or
example counts as durable claims. Preserve the snapshot validation and graceful
fallbacks for GitHub API failures, rate limits, or stale data.

`GITHUB_TOKEN` is needed only when deliberately running a script or workflow that
refreshes data from GitHub; normal local builds do not require it. Never commit,
print, or expose a token.

## Hero runs

`hero-run*.json` are captured real OMA runs used by the landing page. A
localized hero run must be captured with the corresponding language through
`scripts/capture-hero-dag.mjs`; do not hand-translate captured run JSON.
