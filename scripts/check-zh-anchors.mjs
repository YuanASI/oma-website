// Validate fragment links in Simplified Chinese docs against the heading IDs
// Starlight generates with github-slugger. This intentionally reads source
// Markdown/MDX so the check stays fast enough to run before every CI build.
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import GithubSlugger from 'github-slugger';

const ZH_ROOT = 'src/content/docs/zh';

const listDocs = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listDocs(path);
    return /\.mdx?$/.test(entry.name) ? [path] : [];
  });

const outsideFences = (source) => {
  const lines = [];
  let fence = null;
  let inFrontmatter = source.startsWith('---\n') || source.startsWith('---\r\n');

  for (const [index, line] of source.split(/\r?\n/).entries()) {
    if (inFrontmatter) {
      if (index > 0 && line === '---') inFrontmatter = false;
      continue;
    }

    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      const candidate = marker[1];
      if (!fence) fence = candidate;
      else if (candidate[0] === fence[0] && candidate.length >= fence.length) fence = null;
      continue;
    }
    if (!fence) lines.push({ number: index + 1, text: line });
  }

  return lines;
};

const decodeEntities = (text) =>
  text
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([\da-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name) => ({
      amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
    })[name]);

// Headings in this docs tree use ordinary inline Markdown. Reduce that markup
// to the visible text github-slugger receives from Starlight's Markdown AST.
const headingText = (raw) => {
  // Inline HTML would require the same AST parsing Starlight performs. Fail
  // closed instead of attempting to sanitize arbitrary markup with a regex.
  if (raw.includes('<') || raw.includes('>')) {
    throw new Error(`Inline HTML is not supported in a checked heading: ${raw}`);
  }

  const codeSpans = [];
  const text = decodeEntities(raw)
    .replace(/[ \t]+#+[ \t]*$/, '')
    .replace(/!?(\[([^\]]*)\])\([^)]*\)/g, '$2')
    .replace(/(`+)(.*?)\1/g, (_, __, code) => {
      const index = codeSpans.push(code) - 1;
      return `\u{e000}${index}\u{e001}`;
    })
    // Unlike most punctuation, github-slugger preserves underscores. Remove
    // only underscores that Markdown treats as emphasis delimiters, while
    // retaining identifiers such as foo_bar (including inside code spans).
    .replace(/(^|[^\p{L}\p{N}])(_{1,2})(?=\S)(.*?\S)\2(?![\p{L}\p{N}])/gu, '$1$3')
    .replace(/\\([\\`*{}\[\]()#+\-.!_>])/g, '$1')
    .replace(/\u{e000}(\d+)\u{e001}/gu, (_, index) => codeSpans[Number(index)])
    .trim();

  return text;
};

const routeFor = (file) => {
  const path = relative(ZH_ROOT, file).split(sep).join('/');
  return `/zh/${path.slice(0, -extname(path).length)}/`;
};

const pages = new Map();
for (const file of listDocs(ZH_ROOT)) {
  const source = readFileSync(file, 'utf8');
  const lines = outsideFences(source);
  const slugger = new GithubSlugger();
  const headings = new Set();

  for (const line of lines) {
    const match = line.text.match(/^\s{0,3}#{1,6}[ \t]+(.+?)\s*$/);
    if (!match) continue;
    headings.add(slugger.slug(headingText(match[1])));
  }

  pages.set(routeFor(file), { file, headings, lines });
}

const failures = [];
let checked = 0;

for (const [sourceRoute, page] of pages) {
  for (const line of page.lines) {
    // Inline code cannot contain a real Markdown link; removing it avoids
    // interpreting documentation examples as links.
    const visible = line.text.replace(/(`+)(.*?)\1/g, '');
    for (const match of visible.matchAll(/\]\(([^\s)]+)(?:\s+["'][^)]*["'])?\)/g)) {
      const href = match[1];
      let targetRoute;
      let fragment;

      if (href.startsWith('#')) {
        targetRoute = sourceRoute;
        fragment = href.slice(1);
      } else if (href.startsWith('/zh/') && href.includes('#')) {
        const url = new URL(href, 'https://docs.invalid');
        targetRoute = decodeURIComponent(url.pathname).replace(/\/?$/, '/');
        fragment = url.hash.slice(1);
      } else {
        continue;
      }

      checked++;
      try {
        fragment = decodeURIComponent(fragment);
      } catch {
        failures.push({ file: page.file, line: line.number, href, targetRoute, reason: 'invalid URL encoding' });
        continue;
      }

      const target = pages.get(targetRoute);
      if (!target) {
        failures.push({ file: page.file, line: line.number, href, targetRoute, reason: 'target page not found' });
      } else if (!target.headings.has(fragment)) {
        failures.push({ file: page.file, line: line.number, href, targetRoute, reason: 'heading id not found' });
      }
    }
  }
}

if (failures.length) {
  console.error(`Found ${failures.length} dangling Chinese doc anchor(s):`);
  for (const failure of failures) {
    console.error(`- ${failure.file}:${failure.line} ${failure.href} -> ${failure.targetRoute} (${failure.reason})`);
  }
  process.exitCode = 1;
} else {
  console.log(`Checked ${checked} Chinese doc anchor link(s) across ${pages.size} page(s).`);
}
