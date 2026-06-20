// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import { omaDark, omaLight } from './src/styles/code-theme.mjs';

// https://astro.build/config
export default defineConfig({
	// Required for sitemap / canonical / OG absolute URLs (PRD §4.6 GEO).
	site: 'https://open-multi-agent.com',
	// `/github` → repo, preserving the old direct-to-GitHub habit (PRD §3 / §9).
	// In static output this emits a meta-refresh redirect page that works on any
	// host. A true HTTP 301 is set at the host during deploy (PRD §12 item 6) —
	// e.g. a Cloudflare Pages `_redirects` line: `/github https://github.com/open-multi-agent/open-multi-agent 301`.
	redirects: {
		'/github': 'https://github.com/open-multi-agent/open-multi-agent',
	},
	// Blog posts (src/content/blog) render monochrome code blocks styled in
	// blog.css — disabling Astro's Shiki here keeps every code glyph at a
	// controlled >=4.5:1 contrast. Starlight docs use Expressive Code (configured
	// on the integration below), which this setting does not touch.
	markdown: { syntaxHighlight: false },
	integrations: [
		starlight({
			title: 'Open Multi-Agent',
			// Brand mark in the docs header — light/dark variants mirror the landing
			// nav (warm-black-body mark on the light canvas, bone-body on dark).
			// replacesTitle stays false so the "Open Multi-Agent" wordmark sits beside it.
			logo: {
				light: './src/assets/logo-mark-light.svg',
				dark: './src/assets/logo-mark-dark.svg',
				alt: 'Open Multi-Agent',
			},
			description:
				'TypeScript-native multi-agent orchestration. From a goal to a task DAG, automatically — three runtime dependencies, runs anywhere Node.js runs.',
			// Code blocks use the OMA syntax palette (blue/emerald/amber/muted) to
			// match the landing CodeBlock. `themes` carries only the token hues
			// (see src/styles/code-theme.mjs); `useStarlightUiThemeColors: true`
			// keeps the warm-dark frame driven by the --sl-color-* vars in
			// starlight-theme.css, and `minSyntaxHighlightingColorContrast: 0`
			// renders the palette exactly (no automatic contrast lightening).
			//
			// If you edit these hues, clear Astro's content-render cache before
			// rebuilding: `rm -rf node_modules/.astro .astro`. That cache keys the
			// rendered code-block HTML (inline token colors + the ec.<hash>.css
			// link) on source content, NOT on this config — so a stale cache keeps
			// the old link while the build emits a new hash → 404 / unstyled blocks.
			// (Fresh CI checkouts have no cache, so production builds are unaffected.)
			expressiveCode: {
				themes: [omaDark, omaLight],
				useStarlightUiThemeColors: true,
				minSyntaxHighlightingColorContrast: 0,
			},
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/open-multi-agent/open-multi-agent',
				},
			],
			// OMA design tokens themed onto Starlight (dark-first). Order matters:
			// offline Fontsource fonts → tokens (single source of truth) → the SL mapping.
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
						{ label: 'Checkpoint & resume', slug: 'reference/checkpoint' },
						{ label: 'Context management', slug: 'reference/context-management' },
						{ label: 'Consensus', slug: 'reference/consensus' },
						{ label: 'Model routing', slug: 'reference/model-routing' },
						{ label: 'CLI', slug: 'reference/cli' },
					],
				},
			],
		}),
		// Emits sitemap-index.xml + sitemap-0.xml at the site root (PRD §4.6 GEO).
		// robots.txt already points crawlers at /sitemap-index.xml; this integration
		// is what generates it. Needs `site` (set above) to build absolute URLs.
		sitemap(),
	],
});
