// Inventory of the framework's example suite, for /examples.
//
// PRD §4.3 hard requirement: the page must list EVERY supported entry and stay
// in sync with the repo — no hand-maintained list. The canonical inventory is
// derived from the framework catalog + schema and cross-checked against the git
// tree at one immutable commit by scripts/refresh-gh-data.mjs. getExamples()
// below just reads the committed snapshot, so builds remain deterministic.

import examplesSnapshot from '../data/examples.json';
import sourceSnapshot from '../data/examples-source.json';

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

const FEATURED_FALLBACKS: Example[] = [
  {
    name: 'express-customer-support',
    title: 'Express Customer Support',
    blurb: 'Express REST API: runTasks() behind POST /tickets with structured output and explicit HTTP error mapping.',
    href: `https://github.com/${SLUG}/tree/${BRANCH}/${ROOT}/integrations/express-customer-support`,
  },
  FALLBACK_EXAMPLES.find((e) => e.name === 'incident-postmortem-dag')!,
  FALLBACK_EXAMPLES.find((e) => e.name === 'meeting-summarizer')!,
];

export const FEATURED_USE_CASE_SLUGS = [
  'express-customer-support',
  'incident-postmortem-dag',
  'meeting-summarizer',
] as const;

// A single code example's detail record — full source + structure parsed from the
// real file by scripts/refresh-gh-data.mjs (JSDoc header + imports; nothing hand-
// written), powering the /examples/<slug>/ pages. Selected full apps may also
// provide a synchronized entrypoint + README-backed detail record.
export type ExampleCategory = 'cookbook' | 'basics' | 'patterns' | 'apps';
export interface ExampleDetail {
  name: string; // == slug, e.g. "contract-review-dag"
  category: ExampleCategory;
  title: string; // authored title from the file's JSDoc, e.g. "Contract Review DAG with Step-Level Retry"
  intent: string; // maintainer's own description (plain text) — used for the lede + meta
  apis: string[]; // OMA symbols the file imports from the framework entrypoint
  run: string[]; // exact run command(s) from the JSDoc "Run:" block
  prereqs: string[]; // "Prerequisites:" lines (e.g. required env vars)
  loc: number; // source line count
  blob: string; // canonical GitHub source URL
  sourcePath?: string; // only needed when the source is outside <category>/<slug>.ts
  source: string; // full file text (rendered syntax-highlighted)
}

export interface ExamplesData {
  provenance: ExamplesProvenance;
  cookbook: Example[];
  apps: Example[];
  reference: Example[];
  vendor: Example[];
  basics: Example[];
  patterns: Example[];
  providers: Example[];
  // Kept in the snapshot for full catalog coverage. The current /examples IA
  // continues to expose production examples through productionHref.
  production: Example[];
  productionHref: string;
  browseHref: string;
}

export interface ExamplesProvenance {
  sourceRepository: string;
  requestedCommit: string;
  resolvedCommit: string;
  commitTreeSha: string;
  inputs: {
    catalog: { path: string; blobSha: string };
    schema: { path: string; blobSha: string };
    examplesTree: { path: string; treeSha: string };
  };
  generation: {
    consumer: string;
    catalogSchemaVersion: number;
    catalogEntryCount: number;
    relation: string;
  };
}

function isExamplesProvenance(value: unknown): value is ExamplesProvenance {
  if (!value || typeof value !== 'object') return false;
  const provenance = value as Partial<ExamplesProvenance>;
  return (
    typeof provenance.sourceRepository === 'string' &&
    typeof provenance.requestedCommit === 'string' &&
    provenance.requestedCommit === provenance.resolvedCommit &&
    typeof provenance.commitTreeSha === 'string' &&
    typeof provenance.inputs?.catalog?.blobSha === 'string' &&
    typeof provenance.inputs?.schema?.blobSha === 'string' &&
    typeof provenance.inputs?.examplesTree?.treeSha === 'string'
  );
}

function sameExamplesProvenance(left: ExamplesProvenance, right: ExamplesProvenance): boolean {
  return (
    left.sourceRepository === right.sourceRepository &&
    left.resolvedCommit === right.resolvedCommit &&
    left.commitTreeSha === right.commitTreeSha &&
    left.inputs.catalog.path === right.inputs.catalog.path &&
    left.inputs.catalog.blobSha === right.inputs.catalog.blobSha &&
    left.inputs.schema.path === right.inputs.schema.path &&
    left.inputs.schema.blobSha === right.inputs.schema.blobSha &&
    left.inputs.examplesTree.path === right.inputs.examplesTree.path &&
    left.inputs.examplesTree.treeSha === right.inputs.examplesTree.treeSha
  );
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
    !Array.isArray(d.production) ||
    !isExamplesProvenance(d.provenance) ||
    typeof d.productionHref !== 'string' ||
    typeof d.browseHref !== 'string'
  ) {
    return null;
  }
  return d as ExamplesData;
}

export function getFeaturedUseCases(data: ExamplesData | null = getExamples()): Example[] {
  if (!data) return FEATURED_FALLBACKS;
  const bySlug = new Map(
    [...data.cookbook, ...data.apps, ...data.basics, ...data.patterns]
      .map((example) => [example.name, example] as const),
  );
  const featured = FEATURED_USE_CASE_SLUGS
    .map((slug) => bySlug.get(slug))
    .filter((example): example is Example => Boolean(example));
  return featured.length === FEATURED_USE_CASE_SLUGS.length ? featured : FEATURED_FALLBACKS;
}

interface ExamplesSource {
  repo: string;
  provenance: ExamplesProvenance;
  details: Record<string, ExampleDetail>;
}

function getExamplesSource(): ExamplesSource | null {
  const source = sourceSnapshot as Partial<ExamplesSource>;
  const inventory = examplesSnapshot as Partial<ExamplesData>;
  if (
    typeof source.repo !== 'string' ||
    typeof source.details !== 'object' ||
    source.details === null ||
    !isExamplesProvenance(source.provenance) ||
    !isExamplesProvenance(inventory.provenance) ||
    !sameExamplesProvenance(source.provenance, inventory.provenance)
  ) {
    return null;
  }
  return source as ExamplesSource;
}

// All example detail records, in the JSON's insertion order. Returns [] if the
// snapshot is missing/malformed — getStaticPaths then simply emits no detail
// pages (the index still renders and links out), rather than failing the build.
export function getAllExampleDetails(): ExampleDetail[] {
  const source = getExamplesSource();
  return source ? Object.values(source.details) : [];
}

// One detail record by slug (== Example.name), or null when absent — lets the
// index link out to GitHub for entries without a captured source.
export function getExampleDetail(slug: string): ExampleDetail | null {
  const detail = getExamplesSource()?.details[slug];
  return detail ?? null;
}

// Slugs that have a detail page — used by the index to decide internal-link vs
// external-link per entry.
export function detailSlugs(): Set<string> {
  return new Set(getAllExampleDetails().map((d) => d.name));
}
