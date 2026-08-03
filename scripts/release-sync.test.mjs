// Unit tests for the release-notes transform (scripts/release-sync-lib.mjs).
// Run: node --test scripts/release-sync.test.mjs  (wired into `pnpm check`).
//
// The cases below are drawn from real bodies in the framework's GitHub releases:
// scoped package names next to contributor logins, version tails after `@`, PR
// ranges, an already-linked mention, and both shapes of framework doc link.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  autolinkGitHubRefs,
  compareVersionsDesc,
  isVendorableRelease,
  normalizeReleaseBody,
  releaseVersion,
  renderReleaseFile,
  rewriteReleaseLinks,
  transformReleaseBody,
} from './release-sync-lib.mjs';

test('releaseVersion strips the tag prefix', () => {
  assert.equal(releaseVersion('v1.14.0'), '1.14.0');
  assert.equal(releaseVersion('1.14.0'), '1.14.0');
});

test('compareVersionsDesc orders newest first', () => {
  const tags = ['1.9.0', '1.10.0', '1.4.2', '1.14.0', '1.4.10'];
  assert.deepEqual(
    [...tags].sort(compareVersionsDesc),
    ['1.14.0', '1.10.0', '1.9.0', '1.4.10', '1.4.2'],
  );
});

test('drafts are not vendorable, published releases are', () => {
  assert.equal(isVendorableRelease({ tag_name: 'v1.14.0', draft: false }), true);
  assert.equal(isVendorableRelease({ tag_name: 'v1.14.0', draft: true }), false);
  assert.equal(isVendorableRelease({ draft: false }), false);
  assert.equal(isVendorableRelease(null), false);
});

test('normalizeReleaseBody drops a leading H1 and normalizes endings', () => {
  assert.equal(normalizeReleaseBody('# v1.0.0\r\n\r\nBody text.\r\n\r\n'), 'Body text.\n');
  assert.equal(normalizeReleaseBody('No heading here.'), 'No heading here.\n');
});

test('mentions link, scoped packages and version tails do not', () => {
  assert.equal(
    autolinkGitHubRefs('Thanks to @LambIessz for the fallback.'),
    'Thanks to [@LambIessz](https://github.com/LambIessz) for the fallback.',
  );
  // A trailing sentence period stays outside the link.
  assert.equal(
    autolinkGitHubRefs('Reported by @JackChen-me.'),
    'Reported by [@JackChen-me](https://github.com/JackChen-me).',
  );
  // Scoped package names and pinned versions are not logins.
  for (const untouched of [
    'Install @open-multi-agent/core to start.',
    'The bundled core@1.13.0 stays compatible.',
    'Run npm create oma-app@latest today.',
    'Import from @open-multi-agent/core/observability/file now.',
  ]) {
    assert.equal(autolinkGitHubRefs(untouched), untouched);
  }
});

test('issue refs link, including ranges', () => {
  assert.equal(
    autolinkGitHubRefs('Phase 2 of #223.'),
    'Phase 2 of [#223](https://github.com/open-multi-agent/open-multi-agent/issues/223).',
  );
  assert.equal(
    autolinkGitHubRefs('Batched (#403–#409)'),
    'Batched ([#403](https://github.com/open-multi-agent/open-multi-agent/issues/403)–'
    + '[#409](https://github.com/open-multi-agent/open-multi-agent/issues/409))',
  );
});

test('code spans, fenced code, and existing links are left alone', () => {
  const inline = 'The `#163` marker and `@open-multi-agent/core` stay verbatim.';
  assert.equal(autolinkGitHubRefs(inline), inline);

  const fenced = '```bash\nnpm install @open-multi-agent/core@1.14.0 # see #223\n```\n';
  assert.equal(autolinkGitHubRefs(fenced), fenced);

  const linked = 'Thanks to [@agentsonar](https://github.com/agentsonar) for the report.';
  assert.equal(autolinkGitHubRefs(linked), linked);

  // A bare URL that happens to end in a #anchor is not a ref site either.
  const url = 'See https://github.com/open-multi-agent/open-multi-agent/pull/223 for the diff.';
  assert.equal(autolinkGitHubRefs(url), url);

  // Markdown headings survive: `#` is only a ref when digits follow.
  assert.equal(autolinkGitHubRefs('## Install\n'), '## Install\n');
});

test('framework doc links resolve on-site only when the Reference page is vendored', () => {
  const vendored = new Set(['adaptive-recovery', 'observability']);
  assert.equal(
    rewriteReleaseLinks('See [the guide](docs/adaptive-recovery.md).', vendored),
    'See [the guide](/reference/adaptive-recovery/).',
  );
  assert.equal(
    rewriteReleaseLinks('See [obs](docs/observability.md#exporters).', vendored),
    'See [obs](/reference/observability/#exporters).',
  );
  assert.equal(
    rewriteReleaseLinks(
      'See [migration](https://github.com/open-multi-agent/open-multi-agent/blob/main/docs/observability.md).',
      vendored,
    ),
    'See [migration](/reference/observability/).',
  );
  // Not vendored here → stays on GitHub rather than 404ing on the site.
  assert.equal(
    rewriteReleaseLinks('See [internals](docs/architecture-notes.md).', vendored),
    'See [internals](https://github.com/open-multi-agent/open-multi-agent/blob/main/docs/architecture-notes.md).',
  );
});

test('renderReleaseFile emits curated front-matter above the transformed body', () => {
  const file = renderReleaseFile({
    tag_name: 'v1.14.0',
    published_at: '2026-08-01T03:09:10Z',
    html_url: 'https://github.com/open-multi-agent/open-multi-agent/releases/tag/v1.14.0',
    prerelease: false,
    body: '## Added\n\n- Adaptive recovery (#440) by @LambIessz.\n',
  }, new Set());

  assert.equal(
    file,
    `---
version: '1.14.0'
tag: 'v1.14.0'
date: 2026-08-01
url: 'https://github.com/open-multi-agent/open-multi-agent/releases/tag/v1.14.0'
---

## Added

- Adaptive recovery ([#440](https://github.com/open-multi-agent/open-multi-agent/issues/440)) by [@LambIessz](https://github.com/LambIessz).
`,
  );
});

test('renderReleaseFile flags prereleases and rejects an undated release', () => {
  const file = renderReleaseFile({
    tag_name: 'v2.0.0-rc.1',
    published_at: '2026-09-01T00:00:00Z',
    html_url: 'https://example.com/rc',
    prerelease: true,
    body: 'Release candidate.',
  });
  assert.match(file, /^prerelease: true$/m);

  assert.throws(
    () => renderReleaseFile({ tag_name: 'v1.0.0', published_at: null, html_url: 'x', body: '' }),
    /no usable published_at/,
  );
});

test('transformReleaseBody is idempotent', () => {
  const body = '## Thanks\n\n- Fixed in #412 by @octo-patch.\n\nSee [docs](docs/observability.md).\n';
  const once = transformReleaseBody(body, new Set(['observability']));
  assert.equal(transformReleaseBody(once, new Set(['observability'])), once);
});
