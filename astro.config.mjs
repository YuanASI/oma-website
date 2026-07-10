// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import { omaDark, omaLight } from './src/styles/code-theme.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// ── Sitemap per-type tuning (PRD §4.6 GEO) ──────────────────────────────────
// @astrojs/sitemap lists every route at a flat default priority. serializeSitemap
// below assigns priority + changefreq per page type and stamps <lastmod> on blog
// posts. Blog dates are read from frontmatter here at config time (astro:content
// isn't available inside the config); this mirrors the approach used in the
// open-design landing astro.config. See docs/growth/seo-benchmark.md.
const BLOG_DIR = join(import.meta.dirname, 'src/content/blog');

/** @type {Map<string, string>} pathname (trailing slash) → YYYY-MM-DD */
const blogLastmod = new Map();

/**
 * Read pubDate/updatedDate from each blog post's frontmatter into blogLastmod,
 * keyed by the post's final URL path. en posts live flat in BLOG_DIR (/blog/…);
 * zh translations mirror them under blog/zh/ (/zh/blog/…).
 * @param {string} dir
 * @param {string} urlPrefix
 */
function collectBlogDates(dir, urlPrefix) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			// Only en (flat) + zh (blog/zh) today; add a branch to localize more.
			if (entry.name === 'zh') collectBlogDates(join(dir, 'zh'), '/zh/blog/');
			continue;
		}
		if (!entry.name.endsWith('.md') || entry.name.startsWith('_')) continue;
		const fm = readFileSync(join(dir, entry.name), 'utf-8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
		if (!fm) continue;
		// updatedDate wins over pubDate (matches the BlogPosting dateModified).
		const date =
			fm[1].match(/^updatedDate:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1] ??
			fm[1].match(/^pubDate:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1];
		if (date) blogLastmod.set(`${urlPrefix}${entry.name.replace(/\.md$/, '')}/`, date);
	}
}
collectBlogDates(BLOG_DIR, '/blog/');

/**
 * Per-type priority/changefreq + blog <lastmod>. zh pages inherit their English
 * counterpart's weight (locale prefix stripped before matching); lastmod is
 * looked up by the full locale-carrying path.
 * @param {import('@astrojs/sitemap').SitemapItem} item
 */
function serializeSitemap(item) {
	let path = new URL(item.url).pathname;
	if (!path.endsWith('/')) path += '/';
	const p = path.replace(/^\/zh\//, '/'); // de-localized path for matching

	let priority = 0.5;
	/** @type {import('@astrojs/sitemap').SitemapItem['changefreq']} */
	let changefreq = 'monthly';

	if (p === '/') {
		priority = 1.0;
		changefreq = 'daily';
	} else if (p === '/blog/') {
		priority = 0.9;
		changefreq = 'daily';
	} else if (/^\/blog\/[^/]+\/$/.test(p)) {
		priority = 0.8;
		changefreq = 'weekly';
		const lastmod = blogLastmod.get(path);
		if (lastmod) item.lastmod = lastmod;
	} else if (/^\/(compare|solutions|integrations)\/$/.test(p)) {
		priority = 0.8;
		changefreq = 'weekly';
	} else if (/^\/(compare|solutions|integrations)\/[^/]+\/$/.test(p)) {
		priority = 0.7;
		changefreq = 'weekly';
	} else if (/^\/(examples|showcase|architecture)\/$/.test(p)) {
		priority = 0.6;
		changefreq = 'monthly';
	} else if (/^\/(getting-started|guides|reference)\//.test(p)) {
		priority = 0.6;
		changefreq = 'monthly';
	}

	item.priority = priority;
	item.changefreq = changefreq;
	return item;
}

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
				'TypeScript-native multi-agent orchestration. From a goal to a task DAG, automatically — three runtime dependencies, drops into any Node.js backend.',
			// Multilingual docs: English at the root (/), 简体中文 at /zh/. Adding a
			// locale later is one line here + a src/content/docs/<key>/ tree — the page
			// templates never fork. `lang: 'zh-CN'` (not 'zh') is what matches
			// Starlight's built-in zh-CN UI strings + the "untranslated" fallback
			// notice; the route key `zh` only sets the URL segment and content dir.
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				zh: { label: '简体中文', lang: 'zh-CN' },
				// ja: { label: '日本語', lang: 'ja' },  // future: this line + docs/ja/
			},
			// Override Starlight's default <head>: it emits og:* + twitter:card but
			// no social-card image and no JSON-LD. StarlightHead adds both for docs.
			components: { Head: './src/components/StarlightHead.astro' },
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
			// Each label carries its zh-CN translation inline (Starlight's
			// SidebarItem.translations, keyed by `lang`). English labels stay as the
			// root-locale text; `slug` is locale-agnostic — Starlight resolves it to
			// docs/zh/<slug> when present, else falls back to the English page.
			sidebar: [
				{
					label: 'Getting Started',
					translations: { 'zh-CN': '入门指南' },
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction', translations: { 'zh-CN': '简介' } },
						{ label: 'Quick Start', slug: 'getting-started/quick-start', translations: { 'zh-CN': '快速开始' } },
						{ label: 'Three Ways to Run', slug: 'getting-started/three-ways-to-run', translations: { 'zh-CN': '三种运行方式' } },
					],
				},
				{
					label: 'Guides',
					translations: { 'zh-CN': '指南' },
					items: [
						{ label: 'Orchestration Controls', slug: 'guides/orchestration-controls', translations: { 'zh-CN': '编排控制' } },
						{ label: 'Production Checklist', slug: 'guides/production-checklist', translations: { 'zh-CN': '生产清单' } },
					],
				},
				{
					label: 'Reference',
					translations: { 'zh-CN': '参考' },
					items: [
						{ label: 'Providers', slug: 'reference/providers', translations: { 'zh-CN': '模型提供方' } },
						{ label: 'Tool configuration', slug: 'reference/tool-configuration', translations: { 'zh-CN': '工具配置' } },
						{ label: 'Observability', slug: 'reference/observability', translations: { 'zh-CN': '可观测性' } },
						{ label: 'Shared memory', slug: 'reference/shared-memory', translations: { 'zh-CN': '共享内存' } },
						{ label: 'Checkpoint & resume', slug: 'reference/checkpoint', translations: { 'zh-CN': '检查点与恢复' } },
						{ label: 'Context management', slug: 'reference/context-management', translations: { 'zh-CN': '上下文管理' } },
						{ label: 'Consensus', slug: 'reference/consensus', translations: { 'zh-CN': '共识' } },
						{ label: 'Model routing', slug: 'reference/model-routing', translations: { 'zh-CN': '模型路由' } },
						{ label: 'CLI', slug: 'reference/cli', translations: { 'zh-CN': 'CLI' } },
					],
				},
			],
		}),
		// Emits sitemap-index.xml + sitemap-0.xml at the site root (PRD §4.6 GEO).
		// robots.txt already points crawlers at /sitemap-index.xml; this integration
		// is what generates it. Needs `site` (set above) to build absolute URLs.
		sitemap({ serialize: serializeSitemap }),
	],
});
