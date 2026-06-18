// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	// Required for sitemap / canonical / OG absolute URLs (PRD §4.6 GEO).
	site: 'https://open-multi-agent.com',
	integrations: [
		starlight({
			title: 'Open Multi-Agent',
			description:
				'TypeScript-native multi-agent orchestration. From a goal to a task DAG, automatically — three runtime dependencies, runs anywhere Node.js runs.',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/open-multi-agent/open-multi-agent',
				},
			],
			// Placeholder nav — replaced once repo docs/ are synced in (PRD §4.2).
			sidebar: [
				{
					label: 'Guides',
					items: [{ label: 'Example Guide', slug: 'guides/example' }],
				},
				{
					label: 'Reference',
					items: [{ autogenerate: { directory: 'reference' } }],
				},
			],
		}),
	],
});
