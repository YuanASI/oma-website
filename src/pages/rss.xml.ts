import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

// /rss.xml — feed for the migrated dev.to blog (src/content/blog), newest
// first. Linked from the blog pages (<link rel="alternate">) and the footer.
export async function GET(context: APIContext) {
  const posts = (await getCollection('blog')).sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );
  return rss({
    title: 'Open Multi-Agent — Blog',
    description:
      'Writing on TypeScript multi-agent orchestration: goal-driven task DAGs, mixed-model teams, long-term memory, and lessons from the agent-framework ecosystem.',
    site: context.site ?? 'https://open-multi-agent.com',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
  });
}
