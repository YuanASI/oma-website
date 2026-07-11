#!/usr/bin/env node
// Submit canonical URLs to IndexNow (Bing, Yandex, and partners).
//
// OFF BY DEFAULT. This is a DRY RUN unless you pass --submit. The GitHub Action
// (.github/workflows/indexnow.yml) is workflow_dispatch-only and defaults its
// confirm_submit input to false — nothing is sent to any search engine until you
// explicitly opt in. IndexNow keys are public by design (served at /<key>.txt for
// ownership verification), so the key file committed under public/ is not a secret.
//
// Usage:
//   node scripts/submit-indexnow.mjs            # dry run — print what would be sent
//   node scripts/submit-indexnow.mjs --submit   # actually POST to IndexNow
//
// The site defaults to production; override with OMA_SITE for a staging origin.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const SITE = (process.env.OMA_SITE ?? 'https://open-multi-agent.com').replace(/\/$/, '');
const HOST = new URL(SITE).host;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const SUBMIT = process.argv.includes('--submit');

// The IndexNow key is the basename of the <key>.txt file committed under public/.
// Keeping the key file as the single source of truth means rotating the key is a
// one-file change with no edits here.
function findKey() {
  const dir = join(process.cwd(), 'public');
  const file = readdirSync(dir).find((name) => /^[a-f0-9]{8,128}\.txt$/.test(name));
  if (!file) throw new Error('No IndexNow key file (public/<hex>.txt) found.');
  return file.replace(/\.txt$/, '');
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

// sitemap-index.xml → child sitemaps → the de-duplicated set of <loc> URLs.
async function collectUrls() {
  const index = await fetchText(`${SITE}/sitemap-index.xml`);
  const children = [...index.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const urls = new Set();
  for (const child of children) {
    const xml = await fetchText(child);
    for (const m of xml.matchAll(/<loc>(.*?)<\/loc>/g)) urls.add(m[1]);
  }
  return [...urls];
}

const key = findKey();
const keyLocation = `${SITE}/${key}.txt`;
const urlList = await collectUrls();

console.log(`IndexNow: ${urlList.length} URLs · host=${HOST} · key=${key}`);
console.log(`  keyLocation: ${keyLocation}`);
console.log(`  sample: ${urlList.slice(0, 3).join(', ')}`);

if (!SUBMIT) {
  console.log('\nDry run (default). Pass --submit to POST to IndexNow.');
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation, urlList }),
});
console.log(`\nSubmitted → HTTP ${res.status} ${res.statusText}`);
if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}
