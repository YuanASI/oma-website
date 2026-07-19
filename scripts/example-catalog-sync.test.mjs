import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CATALOG_PATH,
  EXAMPLES_ROOT,
  FRAMEWORK_COMMIT,
  FRAMEWORK_REPOSITORY,
  SCHEMA_PATH,
  blobUrl,
  buildInventory,
  discoverSupportedExampleUnits,
  documentedMultiFileEntrypoints,
  fetchExamplesCatalogSnapshot,
  rawUrl,
  treeUrl,
  validateCatalogAgainstSchema,
  validateCatalogTree,
  validateMultiFileEntrypoints,
} from './example-catalog-sync.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

function schemaFixture() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    required: ['$schema', 'schemaVersion', 'examples'],
    properties: {
      $schema: { const: './catalog.schema.json' },
      schemaVersion: { const: 1 },
      examples: { type: 'array' },
    },
    $defs: {
      capability: { enum: ['run-agent', 'provider-adapter'] },
      example: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'path', 'title', 'description', 'section', 'capabilities', 'format', 'level'],
        properties: {
          id: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
          path: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9._/-]*[A-Za-z0-9]$' },
          title: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          section: { enum: ['goal', 'models-providers'] },
          goal: { enum: ['start-here'] },
          capabilities: { type: 'array' },
          format: { enum: ['script', 'multi-file', 'app'] },
          level: { enum: ['beginner', 'intermediate', 'advanced'] },
          featuredOrder: { type: 'integer' },
          entrypoints: {
            type: 'array',
            items: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9._/-]*[A-Za-z0-9]$' },
          },
        },
        allOf: [{ if: {}, then: {} }, { if: {}, then: {} }],
      },
    },
  };
}

function scriptEntry(overrides = {}) {
  return {
    id: 'hello-agent',
    path: 'basics/hello-agent.ts',
    title: 'Hello Agent',
    description: 'Run one agent.',
    section: 'goal',
    goal: 'start-here',
    capabilities: ['run-agent'],
    format: 'script',
    level: 'beginner',
    ...overrides,
  };
}

function appEntry(overrides = {}) {
  return {
    id: 'nested-app',
    path: 'integrations/nested-app',
    title: 'Nested App',
    description: 'Run an app with a nested route entrypoint.',
    section: 'goal',
    goal: 'start-here',
    capabilities: ['run-agent'],
    format: 'app',
    level: 'intermediate',
    entrypoints: ['app/api/chat/route.ts'],
    ...overrides,
  };
}

function catalogFixture(entries = [scriptEntry(), appEntry()]) {
  return { $schema: './catalog.schema.json', schemaVersion: 1, examples: entries };
}

function treeFixture() {
  return [
    { path: EXAMPLES_ROOT, type: 'tree', sha: '1'.repeat(40) },
    { path: CATALOG_PATH, type: 'blob', sha: '2'.repeat(40) },
    { path: SCHEMA_PATH, type: 'blob', sha: '3'.repeat(40) },
    { path: `${EXAMPLES_ROOT}/basics`, type: 'tree', sha: '4'.repeat(40) },
    { path: `${EXAMPLES_ROOT}/basics/hello-agent.ts`, type: 'blob', sha: '5'.repeat(40) },
    { path: `${EXAMPLES_ROOT}/integrations`, type: 'tree', sha: '6'.repeat(40) },
    { path: `${EXAMPLES_ROOT}/integrations/nested-app`, type: 'tree', sha: '7'.repeat(40) },
    { path: `${EXAMPLES_ROOT}/integrations/nested-app/package.json`, type: 'blob', sha: '8'.repeat(40) },
    { path: `${EXAMPLES_ROOT}/integrations/nested-app/app`, type: 'tree', sha: '9'.repeat(40) },
    { path: `${EXAMPLES_ROOT}/integrations/nested-app/app/api`, type: 'tree', sha: 'a'.repeat(40) },
    { path: `${EXAMPLES_ROOT}/integrations/nested-app/app/api/chat`, type: 'tree', sha: 'b'.repeat(40) },
    { path: `${EXAMPLES_ROOT}/integrations/nested-app/app/api/chat/route.ts`, type: 'blob', sha: 'c'.repeat(40) },
  ];
}

test('all catalog, schema, source, and public links are pinned to the immutable commit', () => {
  for (const url of [rawUrl(CATALOG_PATH), rawUrl(SCHEMA_PATH), blobUrl('path.ts'), treeUrl('path')]) {
    assert.match(url, new RegExp(FRAMEWORK_COMMIT));
    assert.doesNotMatch(url, /\/main\//);
  }
});

test('commit resolution fails closed without consulting a branch tip', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return {
      ok: true,
      json: async () => ({
        sha: '0'.repeat(40),
        commit: { tree: { sha: '1'.repeat(40) } },
      }),
    };
  };
  await assert.rejects(
    fetchExamplesCatalogSnapshot({ fetchImpl }),
    /framework commit resolved to/,
  );
  assert.equal(calls.length, 1);
  assert.match(calls[0], new RegExp(`/commits/${FRAMEWORK_COMMIT}$`));
  assert.doesNotMatch(calls[0], /\/commits\/main$/);
});

test('catalog validation is driven by the fetched schema contract', () => {
  assert.deepEqual(validateCatalogAgainstSchema(catalogFixture(), schemaFixture()), []);
  const invalid = catalogFixture([scriptEntry({ format: 'unknown', unexpected: true })]);
  const errors = validateCatalogAgainstSchema(invalid, schemaFixture());
  assert.ok(errors.some((error) => error.includes('unknown property unexpected')));
  assert.ok(errors.some((error) => error.includes('format is unsupported')));
});

test('tree and catalog coverage is bidirectional', () => {
  const tree = treeFixture();
  assert.deepEqual(discoverSupportedExampleUnits(tree), [
    'basics/hello-agent.ts',
    'integrations/nested-app',
  ]);
  assert.deepEqual(validateCatalogTree(catalogFixture(), tree), []);

  const errors = validateCatalogTree(
    catalogFixture([scriptEntry({ path: 'basics/stale.ts' })]),
    tree,
  );
  assert.ok(errors.includes('example is missing from catalog: basics/hello-agent.ts'));
  assert.ok(errors.includes('example is missing from catalog: integrations/nested-app'));
  assert.ok(errors.includes('catalog path is not a discovered example unit: basics/stale.ts'));
});

test('directory examples resolve nested catalog entrypoints instead of same-name files', () => {
  assert.deepEqual(validateCatalogTree(catalogFixture(), treeFixture()), []);
  const inventory = buildInventory(catalogFixture(), FRAMEWORK_COMMIT);
  assert.equal(inventory.apps[0].name, 'nested-app');
  assert.equal(
    inventory.apps[0].href,
    treeUrl(`${EXAMPLES_ROOT}/integrations/nested-app`, FRAMEWORK_COMMIT),
  );
});

test('multi-file entrypoints match self-documenting runnable sources in both directions', () => {
  const entry = {
    ...appEntry({ id: 'suite', path: 'integrations/suite', format: 'multi-file' }),
    entrypoints: ['nested/run.ts'],
  };
  const sources = {
    'nested/run.ts': `/**\n * Suite\n * Run: npx tsx ${EXAMPLES_ROOT}/integrations/suite/nested/run.ts\n */`,
    'helper.ts': 'export const helper = true;',
  };
  assert.deepEqual(documentedMultiFileEntrypoints(entry, sources), ['nested/run.ts']);
  assert.deepEqual(validateMultiFileEntrypoints(entry, sources), []);
  assert.ok(
    validateMultiFileEntrypoints({ ...entry, entrypoints: ['helper.ts'] }, sources)
      .some((error) => error.includes('documented runnable entrypoint is missing')),
  );
});

test('checked-in snapshots carry matching auditable provenance and directory sources', async () => {
  const [inventory, source] = await Promise.all([
    readFile(join(root, 'src/data/examples.json'), 'utf8').then(JSON.parse),
    readFile(join(root, 'src/data/examples-source.json'), 'utf8').then(JSON.parse),
  ]);
  assert.deepEqual(inventory.provenance, source.provenance);
  assert.equal(inventory.provenance.sourceRepository, FRAMEWORK_REPOSITORY);
  assert.equal(inventory.provenance.requestedCommit, FRAMEWORK_COMMIT);
  assert.equal(inventory.provenance.resolvedCommit, FRAMEWORK_COMMIT);
  assert.equal(source.repo, `${FRAMEWORK_REPOSITORY}@${FRAMEWORK_COMMIT}`);
  assert.equal(
    inventory.provenance.generation.catalogEntryCount,
    ['cookbook', 'apps', 'reference', 'vendor', 'basics', 'patterns', 'providers', 'production']
      .reduce((count, key) => count + inventory[key].length, 0),
  );
  assert.equal(
    source.details['express-customer-support'].sourcePath,
    'integrations/express-customer-support/index.ts',
  );
});

test('automated snapshot PR stages every generated file and CI runs the sync tests', async () => {
  const [workflow, packageJson] = await Promise.all([
    readFile(join(root, '.github/workflows/refresh-gh-data.yml'), 'utf8'),
    readFile(join(root, 'package.json'), 'utf8').then(JSON.parse),
  ]);
  const addPaths = workflow.match(/add-paths:\s*\|\n((?:\s+src\/data\/[^\n]+\n)+)/)?.[1];
  assert.ok(addPaths, 'create-pull-request add-paths block must exist');
  for (const generated of [
    'src/data/gh-stats.json',
    'src/data/examples.json',
    'src/data/examples-source.json',
  ]) {
    assert.match(addPaths, new RegExp(generated.replace('.', '\\.')));
  }
  assert.match(packageJson.scripts.check, /test:example-sync/);
});
