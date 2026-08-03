import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const blogContentTypes = [
	'application',
	'field-note',
	'decision-guide',
	'engineering',
	'release',
] as const;

const blogEvidenceKinds = [
	'runnable-demo',
	'verified-run',
	'public-project',
	'field-observation',
	'source-backed-comparison',
	'technical-analysis',
	'release-note',
] as const;

const blogPostSchema = z.object({
	title: z.string(),
	description: z.string(),
	pubDate: z.coerce.date(),
	// Set only when a post is materially revised after publish; drives
	// dateModified (BlogPosting JSON-LD) + article:modified_time. Omitted
	// posts fall back to pubDate, so unedited posts read as unmodified.
	updatedDate: z.coerce.date().optional(),
	tags: z.array(z.string()).default([]),
	contentType: z.enum(blogContentTypes),
	useCases: z.array(z.string()).default([]),
	industries: z.array(z.string()).default([]),
	evidence: z.object({
		kind: z.enum(blogEvidenceKinds),
		note: z.string(),
	}),
	related: z.object({
		solutions: z.array(z.string()).default([]),
		examples: z.array(z.string()).default([]),
		integrations: z.array(z.string()).default([]),
		comparisons: z.array(z.string()).default([]),
	}).default({ solutions: [], examples: [], integrations: [], comparisons: [] }),
	featured: z.boolean().default(false),
	// The dev.to original (en posts only). The site self-canonicals; this is
	// the "originally published" back-link shown on each post. zh translations
	// aren't on dev.to — they omit this and link back to the en original.
	devtoUrl: z.string().url().optional(),
	readingMinutes: z.number().default(1),
}).superRefine((post, ctx) => {
	if (post.contentType !== 'application') return;

	for (const key of ['solutions', 'examples', 'integrations'] as const) {
		if (post.related[key].length === 0) {
			ctx.addIssue({
				code: 'custom',
				path: ['related', key],
				message: `Application posts must link at least one related ${key.slice(0, -1)}.`,
			});
		}
	}
});

// One published framework release, vendored from its GitHub release notes by
// scripts/sync-releases.mjs. The file name is the version (1.14.0.md); the body
// is upstream's, transformed once at sync time (see release-sync-lib.mjs).
const releaseSchema = z.object({
	version: z.string(),
	tag: z.string(),
	date: z.coerce.date(),
	url: z.string().url(),
	prerelease: z.boolean().default(false),
});

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	// Release notes behind /changelog. Upstream CHANGELOG.md keeps only the last
	// couple of releases, so this collection — not that file — is the archive.
	changelog: defineCollection({
		loader: glob({ pattern: '*.md', base: './src/content/changelog' }),
		schema: releaseSchema,
	}),
	// Blog posts migrated from dev.to (scripts/migrate-devto-blog.mjs). Custom
	// landing-style pages, not Starlight docs — see src/pages/[...locale]/blog/.
	blog: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
		schema: blogPostSchema,
	}),
};
