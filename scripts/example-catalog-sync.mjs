import { posix } from 'node:path';

export const FRAMEWORK_REPOSITORY = 'open-multi-agent/open-multi-agent';
export const FRAMEWORK_COMMIT = '9478b2ff5ffc00db28f103ab5fcfc0f25da31c7c';
export const EXAMPLES_ROOT = 'packages/core/examples';
export const CATALOG_PATH = `${EXAMPLES_ROOT}/catalog.json`;
export const SCHEMA_PATH = `${EXAMPLES_ROOT}/catalog.schema.json`;

const API = `https://api.github.com/repos/${FRAMEWORK_REPOSITORY}`;
const SCRIPT_DIRECTORIES = ['basics', 'cookbook', 'patterns', 'providers'];
const DETAIL_CATEGORIES = new Set(['basics', 'cookbook', 'patterns']);
// Keep the existing detail-page surface. The source path itself comes from the
// catalog entrypoints contract rather than a hard-coded same-name assumption.
const APP_DETAIL_IDS = new Set(['express-customer-support']);

export const rawUrl = (path, commit = FRAMEWORK_COMMIT) =>
  `https://raw.githubusercontent.com/${FRAMEWORK_REPOSITORY}/${commit}/${path}`;
export const blobUrl = (path, commit = FRAMEWORK_COMMIT) =>
  `https://github.com/${FRAMEWORK_REPOSITORY}/blob/${commit}/${path}`;
export const treeUrl = (path, commit = FRAMEWORK_COMMIT) =>
  `https://github.com/${FRAMEWORK_REPOSITORY}/tree/${commit}/${path}`;

function cleanMd(value) {
  return value
    .replace(/\[`?([^`\]]+)`?\]\([^)]*\)/g, '$1')
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstDocLine(source) {
  const block = source.match(/\/\*\*([\s\S]*?)\*\//);
  if (!block) return '';
  for (const raw of block[1].split('\n')) {
    const line = raw.replace(/^\s*\*?\s?/, '').trim();
    if (line) return line;
  }
  return '';
}

const SECTION_RE = /^(Run|Prerequisites?|Key features?|Notes?|Usage|Environment|Env vars?|Output|Steps?)\s*:/i;
const DIAGRAM_RE = /[│├└┌┐┘┤┬┴┼─→←↑↓]|─{2,}|\+--|\|__/;

function docLines(source) {
  const match = source.match(/\/\*\*([\s\S]*?)\*\//);
  if (!match) return [];
  const lines = match[1]
    .split('\n')
    .map((line) => line.replace(/^\s*\*?\s?/, '').replace(/\s+$/, ''));
  while (lines.length && !lines[0].trim()) lines.shift();
  return lines;
}

function parseIntent(lines) {
  const result = [];
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      if (result.length) break;
      continue;
    }
    if (SECTION_RE.test(line) || DIAGRAM_RE.test(line)) break;
    result.push(line);
  }
  return cleanMd(result.join(' ')).replace(/[:\s]+$/, '');
}

function parseSection(lines, labelRe) {
  const result = [];
  let inSection = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!inSection) {
      if (labelRe.test(line)) {
        inSection = true;
        const trailing = line.replace(labelRe, '').trim();
        if (trailing) result.push(trailing);
      }
      continue;
    }
    if (!line) {
      if (result.length) break;
      continue;
    }
    if (SECTION_RE.test(line)) break;
    result.push(line);
  }
  return result;
}

function parseApis(source) {
  const symbols = new Set();
  const importRe = /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"](?:[^'"]*src\/index\.js|@open-multi-agent\/core)['"]/g;
  let match;
  while ((match = importRe.exec(source))) {
    for (const part of match[1].split(',')) {
      const name = part.replace(/\btype\s+/, '').trim();
      if (name && /^[A-Za-z]/.test(name)) symbols.add(name);
    }
  }
  return [...symbols];
}

function markdownIntro(markdown) {
  const result = [];
  for (const raw of markdown.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('# ')) {
      if (result.length) break;
      continue;
    }
    if (line.startsWith('## ') || line.startsWith('```')) break;
    result.push(line);
  }
  return cleanMd(result.join(' '));
}

function markdownCodeSection(markdown, heading) {
  const result = [];
  let inSection = false;
  let inCode = false;
  for (const raw of markdown.split('\n')) {
    const line = raw.trim();
    if (/^##\s+/.test(line)) {
      if (inSection) break;
      inSection = line.toLowerCase() === `## ${heading.toLowerCase()}`;
      continue;
    }
    if (!inSection) continue;
    if (line.startsWith('```')) {
      inCode = !inCode;
      continue;
    }
    if (inCode && line && !line.startsWith('#')) result.push(line);
  }
  return result;
}

function buildScriptDetail(entry, example, source, commit) {
  const lines = docLines(source);
  const run = parseSection(lines, /^Run\s*:/i);
  let intent = parseIntent(lines);
  if (!intent || intent.length < 25 || /\b(?:either|or|and|the|an?|with|via|to|of|for|that|into|when|which|then)$/i.test(intent)) {
    intent = example.description || intent;
  }
  return {
    name: entry.id,
    title: (lines[0] || '').trim() || example.title,
    intent,
    apis: parseApis(source),
    run: run.length ? run : [`npx tsx ${EXAMPLES_ROOT}/${entry.path}`],
    prereqs: parseSection(lines, /^Prerequisites?\s*:/i),
    loc: source.replace(/\s+$/, '').split('\n').length,
    blob: blobUrl(`${EXAMPLES_ROOT}/${entry.path}`, commit),
    sourcePath: entry.path,
    source,
  };
}

function buildAppDetail(entry, example, source, readme, sourcePath, commit) {
  const run = [
    ...markdownCodeSection(readme, 'Setup'),
    ...markdownCodeSection(readme, 'Start the server'),
  ];
  const apiKeys = run
    .map((line) => line.match(/^export\s+([A-Z][A-Z0-9_]+)=/)?.[1])
    .filter(Boolean);
  return {
    name: entry.id,
    title: firstDocLine(source) || example.title,
    intent: markdownIntro(readme) || example.description,
    apis: parseApis(source),
    run: run.length
      ? run
      : [`cd ${EXAMPLES_ROOT}/${entry.path}`, 'npm install', 'npm start'],
    prereqs: apiKeys.map((key) => `${key} for the default provider configuration.`),
    loc: source.replace(/\s+$/, '').split('\n').length,
    blob: blobUrl(`${EXAMPLES_ROOT}/${sourcePath}`, commit),
    sourcePath,
    source,
  };
}

function isSafeRelativePath(value) {
  return typeof value === 'string' &&
    value.length > 0 &&
    !value.startsWith('/') &&
    !value.startsWith('./') &&
    !value.endsWith('/') &&
    !value.includes('\\') &&
    !value.split('/').includes('..') &&
    posix.normalize(value) === value;
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function propertyRule(schema, name) {
  return schema?.$defs?.example?.properties?.[name];
}

export function validateCatalogAgainstSchema(catalog, schema) {
  const errors = [];
  const exampleSchema = schema?.$defs?.example;
  if (schema?.$schema !== 'https://json-schema.org/draft/2020-12/schema') {
    errors.push('schema must use JSON Schema draft 2020-12');
  }
  if (!schema || schema.type !== 'object' || schema.additionalProperties !== false) {
    errors.push('schema root must be a closed object');
  }
  if (!exampleSchema || exampleSchema.type !== 'object' || exampleSchema.additionalProperties !== false) {
    errors.push('schema $defs.example must be a closed object');
  }
  if (!Array.isArray(schema?.required) || !Array.isArray(exampleSchema?.required)) {
    errors.push('schema must declare required root and example fields');
  }
  if (!Array.isArray(exampleSchema?.allOf) || exampleSchema.allOf.length < 2) {
    errors.push('schema must declare section and format conditional contracts');
  }
  if (errors.length) return errors;

  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
    return ['catalog must be an object'];
  }
  for (const required of schema.required) {
    if (!(required in catalog)) errors.push(`catalog is missing required property ${required}`);
  }
  for (const key of Object.keys(catalog)) {
    if (!(key in schema.properties)) errors.push(`catalog has unknown property ${key}`);
  }
  if (catalog.$schema !== schema.properties.$schema?.const) {
    errors.push(`catalog.$schema must be ${schema.properties.$schema?.const}`);
  }
  if (catalog.schemaVersion !== schema.properties.schemaVersion?.const) {
    errors.push(`catalog.schemaVersion must be ${schema.properties.schemaVersion?.const}`);
  }
  if (!Array.isArray(catalog.examples)) {
    errors.push('catalog.examples must be an array');
    return errors;
  }

  const allowedKeys = new Set(Object.keys(exampleSchema.properties));
  const requiredKeys = exampleSchema.required;
  const enumFields = ['section', 'goal', 'format', 'level'];
  catalog.examples.forEach((entry, index) => {
    const label = `examples[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${label} must be an object`);
      return;
    }
    for (const required of requiredKeys) {
      if (!(required in entry)) errors.push(`${label} is missing required property ${required}`);
    }
    for (const key of Object.keys(entry)) {
      if (!allowedKeys.has(key)) errors.push(`${label} has unknown property ${key}`);
    }
    for (const field of ['id', 'path', 'title', 'description']) {
      const rule = propertyRule(schema, field);
      if (typeof entry[field] !== 'string' || (rule?.minLength && entry[field].length < rule.minLength)) {
        errors.push(`${label}.${field} must be a non-empty string`);
      } else if (rule?.pattern && !new RegExp(rule.pattern).test(entry[field])) {
        errors.push(`${label}.${field} does not match the schema pattern`);
      }
    }
    if (typeof entry.path === 'string' && !isSafeRelativePath(entry.path)) {
      errors.push(`${label}.path must be a normalized relative path inside examples/`);
    }
    for (const field of enumFields) {
      if (field in entry && !propertyRule(schema, field)?.enum?.includes(entry[field])) {
        errors.push(`${label}.${field} is unsupported`);
      }
    }
    const capabilities = entry.capabilities;
    const capabilityEnum = schema.$defs.capability?.enum ?? [];
    if (!Array.isArray(capabilities) || capabilities.length < 1) {
      errors.push(`${label}.capabilities must be a non-empty array`);
    } else {
      for (const capability of capabilities) {
        if (!capabilityEnum.includes(capability)) {
          errors.push(`${label}.capabilities contains unsupported value ${capability}`);
        }
      }
      for (const duplicate of duplicateValues(capabilities)) {
        errors.push(`${label}.capabilities repeats ${duplicate}`);
      }
    }
    if (entry.section === 'goal' && !propertyRule(schema, 'goal')?.enum?.includes(entry.goal)) {
      errors.push(`${label}.goal is required and must be supported`);
    }
    if (entry.section === 'models-providers') {
      if ('goal' in entry) errors.push(`${label}.goal is forbidden for models-providers`);
      if ('featuredOrder' in entry) errors.push(`${label}.featuredOrder is forbidden for models-providers`);
      if (typeof entry.path === 'string' && !/^providers\/[a-z0-9-]+\.ts$/.test(entry.path)) {
        errors.push(`${label}.path must point to a top-level providers/*.ts file`);
      }
      if (Array.isArray(capabilities) && !capabilities.includes('provider-adapter')) {
        errors.push(`${label}.capabilities must include provider-adapter`);
      }
    }
    if ('featuredOrder' in entry && (!Number.isInteger(entry.featuredOrder) || entry.featuredOrder < 1)) {
      errors.push(`${label}.featuredOrder must be a positive integer`);
    }
    if (entry.format === 'script') {
      if (typeof entry.path === 'string' && !entry.path.endsWith('.ts')) {
        errors.push(`${label}.path must end in .ts for script format`);
      }
      if ('entrypoints' in entry) errors.push(`${label}.entrypoints is forbidden for script format`);
    } else {
      if (!Array.isArray(entry.entrypoints) || entry.entrypoints.length < 1) {
        errors.push(`${label}.entrypoints must be a non-empty array for directory format`);
      } else {
        const rule = propertyRule(schema, 'entrypoints')?.items;
        for (const entrypoint of entry.entrypoints) {
          if (!isSafeRelativePath(entrypoint) || (rule?.pattern && !new RegExp(rule.pattern).test(entrypoint))) {
            errors.push(`${label}.entrypoints contains an invalid path ${entrypoint}`);
          }
        }
        for (const duplicate of duplicateValues(entry.entrypoints)) {
          errors.push(`${label}.entrypoints repeats ${duplicate}`);
        }
      }
    }
  });

  for (const duplicate of duplicateValues(catalog.examples.map((entry) => entry?.id))) {
    errors.push(`duplicate example id: ${duplicate}`);
  }
  for (const duplicate of duplicateValues(catalog.examples.map((entry) => entry?.path))) {
    errors.push(`duplicate example path: ${duplicate}`);
  }
  const featured = catalog.examples
    .filter((entry) => entry?.section === 'goal' && Number.isInteger(entry.featuredOrder))
    .map((entry) => `${entry.goal}:${entry.featuredOrder}`);
  for (const duplicate of duplicateValues(featured)) {
    errors.push(`duplicate featuredOrder within goal: ${duplicate}`);
  }
  return errors;
}

function relativeExamplePath(repoPath) {
  return repoPath.slice(EXAMPLES_ROOT.length + 1);
}

export function discoverSupportedExampleUnits(tree) {
  const units = [];
  for (const node of tree) {
    if (!node.path.startsWith(`${EXAMPLES_ROOT}/`)) continue;
    const relative = relativeExamplePath(node.path);
    if (node.type === 'blob') {
      if (SCRIPT_DIRECTORIES.some((directory) =>
        new RegExp(`^${directory}/[^/]+\\.ts$`).test(relative))) {
        units.push(relative);
      } else if (/^integrations\/[^/]+\.ts$/.test(relative)) {
        units.push(relative);
      }
    } else if (node.type === 'tree' &&
      (/^integrations\/[^/]+$/.test(relative) || /^production\/[^/]+$/.test(relative))) {
      units.push(relative);
    }
  }
  return units.sort();
}

export function validateCatalogTree(catalog, tree) {
  const errors = [];
  const byPath = new Map(tree.map((node) => [node.path, node]));
  const discovered = discoverSupportedExampleUnits(tree);
  const catalogPaths = new Set(catalog.examples.map((entry) => entry.path));
  const discoveredPaths = new Set(discovered);
  for (const path of discovered.filter((path) => !catalogPaths.has(path))) {
    errors.push(`example is missing from catalog: ${path}`);
  }
  for (const path of [...catalogPaths].filter((path) => !discoveredPaths.has(path)).sort()) {
    errors.push(`catalog path is not a discovered example unit: ${path}`);
  }

  for (const entry of catalog.examples) {
    const repoPath = `${EXAMPLES_ROOT}/${entry.path}`;
    const node = byPath.get(repoPath);
    if (!node) {
      errors.push(`${entry.id}: path does not exist: ${entry.path}`);
      continue;
    }
    if (entry.format === 'script' && node.type !== 'blob') {
      errors.push(`${entry.id}: script path must be a file: ${entry.path}`);
    }
    if (entry.format !== 'script' && node.type !== 'tree') {
      errors.push(`${entry.id}: ${entry.format} path must be a directory: ${entry.path}`);
    }
    if (entry.format === 'app' && !byPath.has(`${repoPath}/package.json`)) {
      errors.push(`${entry.id}: app directory must contain package.json`);
    }
    for (const entrypoint of entry.entrypoints ?? []) {
      const target = byPath.get(`${repoPath}/${entrypoint}`);
      if (!target || target.type !== 'blob') {
        errors.push(`${entry.id}: entrypoint does not exist as a file: ${entrypoint}`);
      }
    }
    if (entry.path.startsWith('production/')) {
      for (const required of ['README.md', 'index.ts']) {
        if (!byPath.has(`${repoPath}/${required}`)) {
          errors.push(`${entry.id}: production example must contain ${required}`);
        }
      }
      if (!byPath.has(`${repoPath}/tests`)) {
        errors.push(`${entry.id}: production example must contain tests/`);
      }
    }
  }
  return errors;
}

export function documentedMultiFileEntrypoints(entry, sourceByRelativePath) {
  const documented = [];
  for (const [relative, source] of Object.entries(sourceByRelativePath)) {
    if (!relative.endsWith('.ts')) continue;
    const docblock = source.match(/^\s*\/\*\*([\s\S]*?)\*\//)?.[0];
    if (!docblock || !/\n\s*\*\s*Run(?:\s+[^:\n]+)?\s*:/.test(docblock)) continue;
    if (docblock.includes(`${EXAMPLES_ROOT}/${entry.path}/${relative}`)) documented.push(relative);
  }
  return documented.sort();
}

export function validateMultiFileEntrypoints(entry, sourceByRelativePath) {
  const errors = [];
  const documented = documentedMultiFileEntrypoints(entry, sourceByRelativePath);
  const registered = [...(entry.entrypoints ?? [])].sort();
  const documentedSet = new Set(documented);
  const registeredSet = new Set(registered);
  for (const path of documented.filter((path) => !registeredSet.has(path))) {
    errors.push(`${entry.id}: documented runnable entrypoint is missing from catalog: ${path}`);
  }
  for (const path of registered.filter((path) => !documentedSet.has(path))) {
    errors.push(`${entry.id}: catalog entrypoint has no self-referencing Run block: ${path}`);
  }
  return errors;
}

function exampleFromEntry(entry, commit) {
  const sourcePath = `${EXAMPLES_ROOT}/${entry.path}`;
  return {
    id: entry.id,
    path: entry.path,
    title: entry.title,
    description: entry.description,
    section: entry.section,
    ...(entry.goal ? { goal: entry.goal } : {}),
    capabilities: [...entry.capabilities],
    format: entry.format,
    level: entry.level,
    ...(Number.isInteger(entry.featuredOrder) ? { featuredOrder: entry.featuredOrder } : {}),
    ...(entry.entrypoints ? { entrypoints: [...entry.entrypoints] } : {}),
    href: entry.format === 'script'
      ? blobUrl(sourcePath, commit)
      : treeUrl(sourcePath, commit),
  };
}

export function buildInventory(catalog, commit) {
  return {
    // Preserve the catalog's complete metadata instead of projecting physical
    // paths back into the website's old cookbook/apps/vendor taxonomy. The
    // website groups these entries exclusively by section + goal.
    entries: catalog.examples.map((entry) => exampleFromEntry(entry, commit)),
    browseHref: treeUrl(EXAMPLES_ROOT, commit),
  };
}

async function fetchJsonStrict(url, label, fetchImpl, headers) {
  const response = await fetchImpl(url, { headers });
  if (!response.ok) {
    throw new Error(`${label} fetch ${response.status}`);
  }
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error instanceof Error ? error.message : error}`);
  }
}

async function fetchTextStrict(url, label, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`${label} fetch ${response.status}`);
  return response.text();
}

function parseJsonStrict(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error instanceof Error ? error.message : error}`);
  }
}

function provenanceFromInputs({ commit, tree, catalog, schema }) {
  const byPath = new Map(tree.tree.map((node) => [node.path, node]));
  const examplesTree = byPath.get(EXAMPLES_ROOT);
  const catalogBlob = byPath.get(CATALOG_PATH);
  const schemaBlob = byPath.get(SCHEMA_PATH);
  if (!examplesTree || !catalogBlob || !schemaBlob) {
    throw new Error('commit tree is missing examples root, catalog, or schema provenance nodes');
  }
  return {
    sourceRepository: FRAMEWORK_REPOSITORY,
    requestedCommit: FRAMEWORK_COMMIT,
    resolvedCommit: commit.sha,
    commitTreeSha: commit.commit.tree.sha,
    inputs: {
      catalog: { path: CATALOG_PATH, blobSha: catalogBlob.sha },
      schema: { path: SCHEMA_PATH, blobSha: schemaBlob.sha },
      examplesTree: { path: EXAMPLES_ROOT, treeSha: examplesTree.sha },
    },
    generation: {
      consumer: 'scripts/refresh-gh-data.mjs',
      catalogSchemaVersion: catalog.schemaVersion,
      catalogEntryCount: catalog.examples.length,
      relation: 'inventory and detail records are generated only from the pinned catalog and matching commit tree',
    },
  };
}

export async function fetchExamplesCatalogSnapshot({ headers = {}, fetchImpl = fetch } = {}) {
  const commit = await fetchJsonStrict(
    `${API}/commits/${FRAMEWORK_COMMIT}`,
    'framework commit',
    fetchImpl,
    headers,
  );
  if (commit.sha !== FRAMEWORK_COMMIT) {
    throw new Error(`framework commit resolved to ${commit.sha}; expected ${FRAMEWORK_COMMIT}`);
  }
  if (commit.commit?.tree?.sha?.length !== 40) {
    throw new Error('framework commit response is missing its tree SHA');
  }

  const tree = await fetchJsonStrict(
    `${API}/git/trees/${commit.commit.tree.sha}?recursive=1`,
    'framework tree',
    fetchImpl,
    headers,
  );
  if (tree.truncated) throw new Error('framework recursive tree response is truncated');
  if (tree.sha !== commit.commit.tree.sha) {
    throw new Error(`framework tree resolved to ${tree.sha}; commit declares ${commit.commit.tree.sha}`);
  }
  if (!Array.isArray(tree.tree)) throw new Error('framework tree response has no entries');

  const [catalogText, schemaText] = await Promise.all([
    fetchTextStrict(rawUrl(CATALOG_PATH), 'example catalog', fetchImpl),
    fetchTextStrict(rawUrl(SCHEMA_PATH), 'example catalog schema', fetchImpl),
  ]);
  const catalog = parseJsonStrict(catalogText, 'example catalog');
  const schema = parseJsonStrict(schemaText, 'example catalog schema');
  const contractErrors = validateCatalogAgainstSchema(catalog, schema);
  if (contractErrors.length) {
    throw new Error(`example catalog/schema validation failed:\n- ${contractErrors.join('\n- ')}`);
  }
  const treeErrors = validateCatalogTree(catalog, tree.tree);
  if (treeErrors.length) {
    throw new Error(`example tree/catalog validation failed:\n- ${treeErrors.join('\n- ')}`);
  }

  for (const entry of catalog.examples.filter((item) => item.format === 'multi-file')) {
    const prefix = `${EXAMPLES_ROOT}/${entry.path}/`;
    const sourcePaths = tree.tree
      .filter((node) => node.type === 'blob' && node.path.startsWith(prefix) && node.path.endsWith('.ts'))
      .map((node) => node.path);
    const sourceEntries = await Promise.all(sourcePaths.map(async (path) => [
      path.slice(prefix.length),
      await fetchTextStrict(rawUrl(path), `${entry.id} source ${path}`, fetchImpl),
    ]));
    const sourceErrors = validateMultiFileEntrypoints(entry, Object.fromEntries(sourceEntries));
    if (sourceErrors.length) {
      throw new Error(`example entrypoint validation failed:\n- ${sourceErrors.join('\n- ')}`);
    }
  }

  const inventory = buildInventory(catalog, commit.sha);
  const details = {};
  const detailEntries = catalog.examples.filter((entry) =>
    (entry.format === 'script' && DETAIL_CATEGORIES.has(entry.path.split('/')[0])) ||
    (entry.format === 'app' && APP_DETAIL_IDS.has(entry.id)));
  for (const entry of detailEntries) {
    const example = exampleFromEntry(entry, commit.sha);
    if (entry.format === 'script') {
      const source = await fetchTextStrict(
        rawUrl(`${EXAMPLES_ROOT}/${entry.path}`),
        `${entry.id} detail source`,
        fetchImpl,
      );
      details[entry.id] = buildScriptDetail(entry, example, source, commit.sha);
      continue;
    }
    const entrypoint = entry.entrypoints[0];
    const sourcePath = `${entry.path}/${entrypoint}`;
    const [source, readme] = await Promise.all([
      fetchTextStrict(rawUrl(`${EXAMPLES_ROOT}/${sourcePath}`), `${entry.id} detail source`, fetchImpl),
      fetchTextStrict(rawUrl(`${EXAMPLES_ROOT}/${entry.path}/README.md`), `${entry.id} README`, fetchImpl),
    ]);
    details[entry.id] = buildAppDetail(entry, example, source, readme, sourcePath, commit.sha);
  }

  const provenance = provenanceFromInputs({ commit, tree, catalog, schema });
  return {
    inventory: { provenance, ...inventory },
    source: {
      repo: `${FRAMEWORK_REPOSITORY}@${commit.sha}`,
      provenance,
      details,
    },
  };
}
