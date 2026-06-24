// Migrate Jack's open-multi-agent dev.to posts into the `blog` content
// collection (src/content/blog/*.md). Re-run to re-sync (idempotent overwrite).
//
//   node scripts/migrate-devto-blog.mjs
//
// dev.to is the original; the site self-canonicals these and links back to the
// dev.to post via `devtoUrl`. After deploy, set each dev.to post's
// canonical_url to its /blog/<slug> URL to consolidate SEO to this domain.
//
// Images: the 3 screenshots in the Vercel post are downloaded into public/blog/
// (run scripts/fetch step once); the markdown image URLs are rewritten to the
// local paths below so nothing depends on dev.to's S3.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const USER = 'jackchenme';

// dev.to slug → site slug (+ optional S3→local image remap)
const POSTS = [
  { slug: 'how-to-run-a-mixed-model-ai-agent-team-in-typescript-1569', out: 'mixed-model-agent-team' },
  { slug: '5-walls-multi-agent-frameworks-hit-receipts-from-mastras-year-of-network-to-supervisor-3am3', out: 'multi-agent-framework-walls' },
  { slug: 'goal-driven-agent-orchestration-vs-explicit-graphs-a-typescript-framework-taxonomy-6i3', out: 'goal-driven-vs-explicit-graphs' },
  { slug: 'give-your-typescript-ai-agents-long-term-memory-with-tencentdb-agent-memory-elm', out: 'agent-long-term-memory-tencentdb' },
  {
    slug: 'adding-multi-agent-orchestration-to-a-vercel-ai-sdk-app-4536',
    out: 'multi-agent-vercel-ai-sdk',
    images: {
      'https://dev-to-uploads.s3.amazonaws.com/uploads/articles/bp8l0e2hcuhl1xoqia0i.png': '/blog/vercel-ai-sdk-1.png',
      'https://dev-to-uploads.s3.amazonaws.com/uploads/articles/a41u2pzrruxshf0bxsgy.png': '/blog/vercel-ai-sdk-2.png',
      'https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wkzo5gk6c6ufbtz30zg0.png': '/blog/vercel-ai-sdk-3.png',
    },
  },
  {
    slug: 'goal-in-dag-out-how-open-multi-agent-turns-a-goal-into-a-task-dag-1n0m',
    out: 'goal-to-task-dag-coordinator',
    images: {
      'https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/inhte0q9kjrrukznvngy.png': '/blog/goal-to-task-dag-coordinator-run.png',
    },
  },
  {
    slug: 'from-transcript-to-typed-action-items-three-parallel-agents-in-typescript-3oe',
    out: 'meeting-summarizer-parallel-agents',
    images: {
      'https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/1g7q3llxmh23bttamsk9.png': '/blog/meeting-summarizer-parallel-agents-run.png',
    },
  },
];

// dev.to embeds its own `--- … ---` front-matter at the top of body_markdown for
// some posts; drop that leading block (we author our own front-matter below).
const stripLeadingFrontmatter = (md) => md.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/^\s+/, '');
// YAML-safe double-quoted scalar (handles ':' and quotes in titles/descriptions).
const y = (s) => JSON.stringify(s ?? '');

// Cross-links between the migrated posts → internal /blog paths (keep readers
// on-site; external dev.to links to non-migrated content are left untouched).
const CROSSLINKS = Object.fromEntries(
  POSTS.map((p) => [`https://dev.to/${USER}/${p.slug}`, `/blog/${p.out}`]),
);

for (const p of POSTS) {
  const r = await fetch(`https://dev.to/api/articles/${USER}/${p.slug}`);
  if (!r.ok) { console.error('FAIL', p.slug, r.status); process.exit(1); }
  const a = await r.json();
  let body = stripLeadingFrontmatter(a.body_markdown);
  for (const [from, to] of Object.entries(p.images ?? {})) body = body.split(from).join(to);
  for (const [from, to] of Object.entries(CROSSLINKS)) body = body.split(from).join(to);
  const fm = [
    '---',
    `title: ${y(a.title)}`,
    `description: ${y(a.description)}`,
    `pubDate: ${a.published_at.slice(0, 10)}`,
    `tags: ${JSON.stringify(a.tags ?? [])}`,
    // dev.to original = a.url, NOT a.canonical_url: once a post's dev.to
    // canonical_url is pointed back at this site (our SEO setup), using it here
    // would make the "originally published" back-link point at ourselves.
    `devtoUrl: ${y(a.url)}`,
    `readingMinutes: ${a.reading_time_minutes ?? 1}`,
    '---',
    '',
  ].join('\n');
  const path = `src/content/blog/${p.out}.md`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, fm + body.trim() + '\n');
  console.log('wrote', path, `(${body.length} chars body)`);
}
