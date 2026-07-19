import { readFileSync } from 'node:fs';
import {
  compareSlugSets,
  extractSidebarReferenceSlugs,
  listLocalReferenceSlugs,
} from './reference-sync-lib.mjs';

const local = listLocalReferenceSlugs();
const sidebar = extractSidebarReferenceSlugs(readFileSync('astro.config.mjs', 'utf8'));
const { missingFromSidebar, missingLocally } = compareSlugSets(local, sidebar);

if (missingFromSidebar.length || missingLocally.length) {
  console.error('Reference docs and sidebar entries are out of sync.');
  if (missingFromSidebar.length) console.error('Missing from sidebar:', missingFromSidebar.join(', '));
  if (missingLocally.length) console.error('Missing local docs:', missingLocally.join(', '));
  process.exitCode = 1;
} else {
  console.log(`Reference sidebar matches all ${local.length} local page(s).`);
}
