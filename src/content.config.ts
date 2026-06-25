import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	// Blog posts migrated from dev.to (scripts/migrate-devto-blog.mjs). Custom
	// landing-style pages, not Starlight docs — see src/pages/blog/.
	blog: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
		schema: z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			// Set only when a post is materially revised after publish; drives
			// dateModified (BlogPosting JSON-LD) + article:modified_time. Omitted
			// posts fall back to pubDate, so unedited posts read as unmodified.
			updatedDate: z.coerce.date().optional(),
			tags: z.array(z.string()).default([]),
			// The dev.to original (en posts only). The site self-canonicals; this is
			// the "originally published" back-link shown on each post. zh translations
			// aren't on dev.to — they omit this and link back to the en original.
			devtoUrl: z.string().url().optional(),
			readingMinutes: z.number().default(1),
		}),
	}),
};
