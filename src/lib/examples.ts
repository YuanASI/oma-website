// Inventory of the framework's example suite, for /examples.
//
// PRD §4.3 hard requirement: the page must list EVERY entry and stay in sync
// with the repo — no hand-maintained list. The canonical inventory is derived
// from the repo's git tree + README tables by scripts/refresh-gh-data.mjs, which
// writes src/data/examples.json. getExamples() below just reads that committed
// snapshot — the fetch/parse used to run at build time and moved out so a
// GitHub blip at deploy can't degrade the page. See the note in ./site.

import examplesSnapshot from '../data/examples.json';

const SLUG = 'open-multi-agent/open-multi-agent';
const BRANCH = 'main';
const ROOT = 'packages/core/examples';
const BLOB = (p: string) => `https://github.com/${SLUG}/blob/${BRANCH}/${p}`;

export interface Example {
  name: string; // raw slug, e.g. "contract-review-dag" (shown mono in compact lists)
  title: string; // humanized, e.g. "Contract Review DAG" (shown in cards)
  blurb: string; // one-line scenario / what-it-shows
  href: string; // link to source on GitHub
}

// Static fallback for the /examples page if the committed snapshot is ever
// missing or malformed and getExamples() returns null. A small curated slice of
// the real cookbook — slugs and blurbs verified against packages/core/examples/
// README.md — so the page degrades to real, clickable recipes instead of an empty
// "go to GitHub" dead end. With the snapshot committed this effectively never
// shows, but keep it in sync if a cookbook entry is renamed/removed upstream.
export const FALLBACK_EXAMPLES: Example[] = [
  { name: 'contract-review-dag', title: 'Contract Review DAG', blurb: 'A 4-task DAG — extract, then a parallel compliance-check and summary, then notify — with step-level retry.', href: BLOB(`${ROOT}/cookbook/contract-review-dag.ts`) },
  { name: 'incident-postmortem-dag', title: 'Incident Postmortem DAG', blurb: 'A 5-task DAG: three parallel root investigations feed a root-cause hypothesis and final postmortem synthesis.', href: BLOB(`${ROOT}/cookbook/incident-postmortem-dag.ts`) },
  { name: 'competitive-monitoring', title: 'Competitive Monitoring', blurb: 'Parallel source monitoring, contradiction detection, and an aggregated intelligence report.', href: BLOB(`${ROOT}/cookbook/competitive-monitoring.ts`) },
  { name: 'meeting-summarizer', title: 'Meeting Summarizer', blurb: 'Fan a transcript out into a summary, structured action items, and sentiment.', href: BLOB(`${ROOT}/cookbook/meeting-summarizer.ts`) },
  { name: 'paper-replication-triage', title: 'Paper Replication Triage', blurb: 'Multi-source paper-replication triage with artifact discovery and a structured go/no-go plan.', href: BLOB(`${ROOT}/cookbook/paper-replication-triage.ts`) },
];

export interface ExamplesData {
  cookbook: Example[];
  apps: Example[];
  reference: Example[];
  vendor: Example[];
  basics: Example[];
  patterns: Example[];
  providers: Example[];
  productionHref: string;
  browseHref: string;
}

// Read the committed snapshot. Returns null only if the file is missing or
// structurally invalid, in which case /examples degrades to FALLBACK_EXAMPLES.
// Kept as a plain return (call sites `await getExamples()` — awaiting a value is
// a no-op) to avoid churning the two /examples + /zh/examples call sites.
export function getExamples(): ExamplesData | null {
  const d = examplesSnapshot as Partial<ExamplesData>;
  if (
    !d ||
    !Array.isArray(d.cookbook) ||
    !Array.isArray(d.apps) ||
    !Array.isArray(d.reference) ||
    !Array.isArray(d.vendor) ||
    !Array.isArray(d.basics) ||
    !Array.isArray(d.patterns) ||
    !Array.isArray(d.providers) ||
    typeof d.productionHref !== 'string' ||
    typeof d.browseHref !== 'string'
  ) {
    return null;
  }
  return d as ExamplesData;
}
