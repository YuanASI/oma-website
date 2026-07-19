// Catalog-backed inventory for /examples.
//
// The framework catalog is validated against its schema and tree at one pinned
// commit by scripts/refresh-gh-data.mjs. This module only consumes that committed
// snapshot: classification comes from section/goal metadata, never README text,
// file names, or physical directory heuristics.

import examplesSnapshot from '../data/examples.json';
import sourceSnapshot from '../data/examples-source.json';
import {
  EXAMPLE_GOALS,
  getFeaturedUseCases as selectFeaturedUseCases,
  getGoalGroups,
  getModelsProviders,
  splitGoalEntries,
  type CatalogExample,
  type ExampleFormat,
  type ExampleGoal,
  type ExampleGoalGroup,
  type ExampleLevel,
} from './example-ia';

export type {
  CatalogExample,
  ExampleFormat,
  ExampleGoal,
  ExampleGoalGroup,
  ExampleLevel,
};
export { splitGoalEntries };

export interface ExampleDetail {
  name: string;
  title: string;
  intent: string;
  apis: string[];
  run: string[];
  prereqs: string[];
  loc: number;
  blob: string;
  sourcePath: string;
  source: string;
}

export interface ExamplesData {
  provenance: ExamplesProvenance;
  entries: CatalogExample[];
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
    typeof provenance.inputs?.examplesTree?.treeSha === 'string' &&
    Number.isInteger(provenance.generation?.catalogEntryCount)
  );
}

function isCatalogExample(value: unknown): value is CatalogExample {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<CatalogExample>;
  const validGoal = entry.goal === undefined || EXAMPLE_GOALS.includes(entry.goal);
  const validSection = entry.section === 'goal' || entry.section === 'models-providers';
  const validFormat = entry.format === 'script' || entry.format === 'multi-file' || entry.format === 'app';
  const validLevel = entry.level === 'beginner' || entry.level === 'intermediate' || entry.level === 'advanced';
  const validFeaturedOrder = entry.featuredOrder === undefined || Number.isInteger(entry.featuredOrder);
  const validEntrypoints = entry.entrypoints === undefined || (
    Array.isArray(entry.entrypoints) && entry.entrypoints.every((entrypoint) => typeof entrypoint === 'string')
  );
  return (
    typeof entry.id === 'string' &&
    typeof entry.path === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.description === 'string' &&
    typeof entry.href === 'string' &&
    validSection &&
    validGoal &&
    validFormat &&
    validLevel &&
    validFeaturedOrder &&
    validEntrypoints &&
    Array.isArray(entry.capabilities) &&
    entry.capabilities.every((capability) => typeof capability === 'string') &&
    (entry.section !== 'goal' || entry.goal !== undefined) &&
    (entry.section !== 'models-providers' || (entry.goal === undefined && entry.featuredOrder === undefined))
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

export function getExamples(): ExamplesData | null {
  const data = examplesSnapshot as Partial<ExamplesData>;
  if (
    !isExamplesProvenance(data.provenance) ||
    !Array.isArray(data.entries) ||
    !data.entries.every(isCatalogExample) ||
    data.entries.length !== data.provenance.generation.catalogEntryCount ||
    new Set(data.entries.map((entry) => entry.id)).size !== data.entries.length ||
    typeof data.browseHref !== 'string'
  ) {
    return null;
  }
  return data as ExamplesData;
}

export function getExampleGoalGroups(data: ExamplesData | null = getExamples()): ExampleGoalGroup[] {
  return data ? getGoalGroups(data.entries) : [];
}

export function getModelsProviderExamples(data: ExamplesData | null = getExamples()): CatalogExample[] {
  return data ? getModelsProviders(data.entries) : [];
}

export function getFeaturedUseCases(data: ExamplesData | null = getExamples()): CatalogExample[] {
  return data ? selectFeaturedUseCases(data.entries) : [];
}

export function getCatalogExample(id: string, data: ExamplesData | null = getExamples()): CatalogExample | null {
  return data?.entries.find((entry) => entry.id === id) ?? null;
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

export function getAllExampleDetails(): ExampleDetail[] {
  const source = getExamplesSource();
  return source ? Object.values(source.details) : [];
}

export function getExampleDetail(slug: string): ExampleDetail | null {
  return getExamplesSource()?.details[slug] ?? null;
}

export function detailSlugs(): Set<string> {
  return new Set(getAllExampleDetails().map((detail) => detail.name));
}
