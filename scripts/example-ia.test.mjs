import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXAMPLE_GOALS,
  compareExamples,
  getFeaturedUseCases,
  getGoalGroups,
  getModelsProviders,
} from '../src/lib/example-ia.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFile(join(root, path), 'utf8');

async function snapshots() {
  const [inventory, source] = await Promise.all([
    read('src/data/examples.json').then(JSON.parse),
    read('src/data/examples-source.json').then(JSON.parse),
  ]);
  return { inventory, source };
}

test('snapshot exposes the five catalog goals and a separate models/providers directory', async () => {
  const { inventory } = await snapshots();
  const groups = getGoalGroups(inventory.entries);
  const modelsProviders = getModelsProviders(inventory.entries);

  assert.deepEqual(groups.map((group) => group.goal), EXAMPLE_GOALS);
  assert.deepEqual(groups.map((group) => group.entries.length), [4, 10, 6, 9, 9]);
  assert.equal(modelsProviders.length, 20);
  assert.ok(modelsProviders.every((entry) => entry.section === 'models-providers'));
});

test('featuredOrder is stable within each goal and unfeatured entries remain discoverable', async () => {
  const { inventory } = await snapshots();
  for (const group of getGoalGroups(inventory.entries)) {
    assert.deepEqual(group.entries, [...group.entries].sort(compareExamples));
    const featured = group.entries.filter((entry) => entry.featuredOrder !== undefined);
    const remaining = group.entries.filter((entry) => entry.featuredOrder === undefined);
    assert.deepEqual(featured.map((entry) => entry.featuredOrder), [...featured.map((entry) => entry.featuredOrder)].sort((a, b) => a - b));
    assert.deepEqual(remaining.map((entry) => entry.id), [...remaining].sort(compareExamples).map((entry) => entry.id));
    assert.equal(featured.length + remaining.length, group.entries.length);
  }
  assert.deepEqual(
    getFeaturedUseCases(inventory.entries).map((entry) => entry.id),
    ['adaptive-customer-support', 'contract-review-dag', 'incident-postmortem-dag'],
  );
});

test('every catalog entry appears exactly once without legacy category projections', async () => {
  const { inventory, source } = await snapshots();
  const groups = getGoalGroups(inventory.entries);
  const rendered = [...groups.flatMap((group) => group.entries), ...getModelsProviders(inventory.entries)];
  assert.equal(inventory.entries.length, inventory.provenance.generation.catalogEntryCount);
  assert.equal(rendered.length, inventory.entries.length);
  assert.equal(new Set(rendered.map((entry) => entry.id)).size, inventory.entries.length);
  assert.deepEqual(
    [...rendered.map((entry) => entry.id)].sort(),
    [...inventory.entries.map((entry) => entry.id)].sort(),
  );
  assert.ok(Object.values(source.details).every((detail) => typeof detail.sourcePath === 'string'));
  assert.ok(Object.values(source.details).every((detail) => !('category' in detail)));
});

test('UI keeps public routes and legacy share anchors while using bilingual goal copy', async () => {
  const [page, detailPage, en, zh] = await Promise.all([
    read('src/pages/[...locale]/examples/index.astro'),
    read('src/pages/[...locale]/examples/[slug].astro'),
    read('src/i18n/en.ts'),
    read('src/i18n/zh.ts'),
  ]);
  for (const goal of EXAMPLE_GOALS) {
    assert.match(page, new RegExp(`'${goal}'|${goal}`));
    assert.match(en, new RegExp(`'${goal}'|${goal}`));
    assert.match(zh, new RegExp(`'${goal}'|${goal}`));
  }
  for (const anchor of ['cookbook', 'integrations', 'building-blocks', 'more']) {
    assert.match(page, new RegExp(`['"]${anchor}['"]`));
  }
  assert.match(detailPage, /\/examples\/\$\{detail\.name\}\//);
  assert.match(page, /\/examples\/\$\{e\.id\}\//);
});

test('legacy README, path, app/vendor, and hard-coded featured fallbacks are absent', async () => {
  const [sync, examples, index, nav] = await Promise.all([
    read('scripts/example-catalog-sync.mjs'),
    read('src/lib/examples.ts'),
    read('src/pages/[...locale]/examples/index.astro'),
    read('src/components/Nav.astro'),
  ]);
  const combined = `${sync}\n${examples}\n${index}\n${nav}`;
  for (const forbidden of [
    'FEATURED_USE_CASE_SLUGS',
    'FALLBACK_EXAMPLES',
    'FEATURED_FALLBACKS',
    'parseTables',
    'parseBullets',
    'inventory.vendor',
    "topLevel === 'integrations'",
  ]) {
    assert.doesNotMatch(combined, new RegExp(forbidden));
  }
});
