// READ-ONLY detector for local vendored bodies that differ from framework main.
// It runs before the weekly sync so the resulting report describes what the
// sync refreshed. Body drift is informational; discovery or fetch failures are
// errors because a green result must mean the comparison actually ran.
import { writeFileSync } from 'node:fs';
import {
  BRANCH,
  EXCLUDE,
  REPO,
  REFDIR,
  RAW,
  classifyUpstreamEntries,
  discoveryHasBlockers,
  formatDiscoveryGate,
  hasUpstreamBodyDrift,
  listLocalFlatReferences,
  readLocalBody,
} from './reference-sync-lib.mjs';

const REPORT = 'upstream-drift-report.md';
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const apiHeaders = token
  ? { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
  : { Accept: 'application/vnd.github+json' };

async function main() {
  const listing = await fetch(`https://api.github.com/repos/${REPO}/contents/docs?ref=${BRANCH}`, { headers: apiHeaders });
  if (!listing.ok) throw new Error(`GitHub contents API returned ${listing.status}`);
  const entries = await listing.json();
  if (!Array.isArray(entries)) throw new Error('GitHub contents API did not return a directory listing');

  const classification = classifyUpstreamEntries(entries, listLocalFlatReferences(REFDIR), EXCLUDE);
  const vendored = new Set(classification.vendored);
  const drifted = [];

  for (const name of classification.vendored) {
    const response = await fetch(RAW(`docs/${name}.md`));
    if (!response.ok) throw new Error(`Upstream fetch failed for docs/${name}.md (${response.status})`);
    if (hasUpstreamBodyDrift(readLocalBody(name, REFDIR), await response.text(), vendored)) {
      drifted.push(name);
    }
  }

  let report = '';
  if (drifted.length) {
    report += '### Upstream Reference drift before sync\n\n';
    report += 'These local vendored bodies differed from framework `main` before this workflow refreshed them:\n\n';
    for (const name of drifted) report += `- \`reference/${name}\`\n`;
  }
  if (discoveryHasBlockers(classification)) {
    if (report) report += '\n';
    report += '### Reference discovery needs review\n\n';
    report += '```text\n';
    report += `${formatDiscoveryGate(classification)}\n`;
    report += '```\n';
  }

  writeFileSync(REPORT, report);
  console.log(report || 'No upstream Reference drift.');
}

main().catch((error) => {
  writeFileSync(REPORT, '');
  console.error(`Unable to check upstream Reference drift: ${error.message}`);
  process.exitCode = 1;
});
