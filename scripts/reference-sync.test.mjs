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
  rewriteLinks,
  transformUpstreamBody,
} from './reference-sync-lib.mjs';

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
  const output = rewriteLinks(input, new Set(['cli']));

  assert.match(output, /\]\(\/reference\/cli\/\)/);
  assert.match(output, /github\.com\/open-multi-agent\/open-multi-agent\/blob\/main\/docs\/observability-migration\.md/);
  assert.match(output, /github\.com\/open-multi-agent\/open-multi-agent\/blob\/main\/docs\/new-capability\.md#api/);
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
