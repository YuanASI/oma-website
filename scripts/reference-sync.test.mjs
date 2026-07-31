import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  EXCLUDE,
  classifyUpstreamEntries,
  compareSlugSets,
  discoveryHasBlockers,
  extractSidebarReferenceSlugs,
  formatDiscoveryGate,
  hasUpstreamBodyDrift,
  listLocalReferenceSlugs,
  resolvePublishedReferenceRef,
  rewriteLinks,
  transformUpstreamBody,
} from './reference-sync-lib.mjs';

test('uses an explicit release ref without network access', async () => {
  const ref = await resolvePublishedReferenceRef({}, 'v1.13.0', () => {
    throw new Error('fetch should not run');
  });
  assert.equal(ref, 'v1.13.0');
});

test('fails closed when GitHub latest and npm latest disagree', async () => {
  const responses = [
    { ok: true, json: async () => ({ tag_name: 'v1.13.0' }) },
    { ok: true, json: async () => ({ 'dist-tags': { latest: '1.12.1' } }) },
  ];
  await assert.rejects(
    resolvePublishedReferenceRef({}, '', async () => responses.shift()),
    /Release truth mismatch/,
  );
});

test('discovers vendored docs while excluding deliberate GitHub-only pages', () => {
  const entries = [
    { type: 'file', name: 'cli.md' },
    { type: 'file', name: 'featured-partner.md' },
    { type: 'file', name: 'new-capability.md' },
    { type: 'dir', name: 'providers' },
  ];
  const result = classifyUpstreamEntries(entries, ['cli'], EXCLUDE);

  assert.deepEqual(result.vendored, ['cli']);
  assert.deepEqual(result.pending, ['new-capability']);
  assert.deepEqual(result.unsupportedDirectories, ['providers']);
  assert.match(formatDiscoveryGate(result), /docs\/new-capability\.md/);
  assert.match(formatDiscoveryGate(result), /docs\/providers\//);
  assert.equal(discoveryHasBlockers(result), true);
});

test('rewrites vendored links locally and all other doc links to GitHub', () => {
  const input = '[CLI](./cli.md) [migration](observability-migration.md) [new](new-capability.md#api)';
  const output = rewriteLinks(input, new Set(['cli', 'observability-migration']));

  assert.match(output, /\]\(\/reference\/cli\/\)/);
  assert.match(output, /\]\(\/reference\/observability-migration\/\)/);
  assert.match(output, /github\.com\/open-multi-agent\/open-multi-agent\/blob\/main\/docs\/new-capability\.md#api/);
});

test('pins external source links to the synchronized release tag', () => {
  const output = rewriteLinks(
    '[new](new-capability.md#api) [source](../packages/core/src/types.ts)',
    new Set(),
    'v1.13.0',
  );

  assert.match(output, /blob\/v1\.13\.0\/docs\/new-capability\.md#api/);
  assert.match(output, /blob\/v1\.13\.0\/packages\/core\/src\/types\.ts/);
});

test('normalizes upstream headings before drift comparison', () => {
  const transformed = transformUpstreamBody('# CLI\n\nSee [tools](./tool-configuration.md).\n\n', new Set(['cli', 'tool-configuration']));
  assert.equal(transformed, 'See [tools](/reference/tool-configuration/).\n');
});

test('detects a local body that is behind the transformed upstream body', () => {
  const vendored = new Set(['cli']);
  const upstream = '# CLI\n\nCurrent body.\n';
  assert.equal(hasUpstreamBodyDrift('Old body.\n', upstream, vendored), true);
  assert.equal(hasUpstreamBodyDrift('Current body.\n', upstream, vendored), false);
});

test('the checked-in Reference files and sidebar slugs stay one-to-one', () => {
  const local = listLocalReferenceSlugs();
  const sidebar = extractSidebarReferenceSlugs(readFileSync('astro.config.mjs', 'utf8'));
  assert.deepEqual(compareSlugSets(local, sidebar), { missingFromSidebar: [], missingLocally: [] });
});

test('sidebar consistency detects either side of a mismatch', () => {
  assert.deepEqual(compareSlugSets(['cli', 'evaluation'], ['cli']), {
    missingFromSidebar: ['evaluation'],
    missingLocally: [],
  });
  assert.deepEqual(compareSlugSets(['cli'], ['cli', 'missing']), {
    missingFromSidebar: [],
    missingLocally: ['missing'],
  });
});
