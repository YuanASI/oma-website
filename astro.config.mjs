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
			// OMA design tokens themed onto Starlight (dark-first). Order matters:
			// offline Fontsource fonts → tokens (single source of truth) → the SL mapping.
			// NOTE: a custom Expressive Code syntax theme (OMA blue/emerald/amber palette,
			// to match the landing CodeBlock) is deferred — overriding `expressiveCode.themes`
			// in this Starlight 0.40 / astro-expressive-code 0.43.1 combo leaves the docs
			// referencing ec.v4551.css while the build emits a content-hashed file → 404.
			// Default EC dark theme is kept until that's root-caused. See PR notes.
			customCss: [
				'@fontsource-variable/geist/index.css',
				'@fontsource-variable/jetbrains-mono/index.css',
				'./src/styles/tokens.css',
				'./src/styles/starlight-theme.css',
			],
			// Phase 1 IA (PRD §4.2). Reference is vendored from the framework repo docs/
			// (baseline commit ef31479); Getting Started + Guides are maintained here.
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Three Ways to Run', slug: 'getting-started/three-ways-to-run' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Orchestration Controls', slug: 'guides/orchestration-controls' },
						{ label: 'Production Checklist', slug: 'guides/production-checklist' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Providers', slug: 'reference/providers' },
						{ label: 'MiniMax setup', slug: 'reference/providers/minimax' },
						{ label: 'Tool configuration', slug: 'reference/tool-configuration' },
						{ label: 'Observability', slug: 'reference/observability' },
						{ label: 'Shared memory', slug: 'reference/shared-memory' },
						{ label: 'Context management', slug: 'reference/context-management' },
						{ label: 'Consensus', slug: 'reference/consensus' },
						{ label: 'Model routing', slug: 'reference/model-routing' },
						{ label: 'CLI', slug: 'reference/cli' },
					],
				},
			],
		}),
	],
});
