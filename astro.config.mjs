// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import { omaDark, omaLight } from './src/styles/code-theme.mjs';
import { rehypeChangelog } from './src/lib/rehype-changelog.mjs';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// ── Sitemap per-type tuning (PRD §4.6 GEO) ──────────────────────────────────
// @astrojs/sitemap lists every route at a flat default priority. serializeSitemap
// below assigns priority + changefreq per page type and stamps <lastmod> on blog
// posts. Blog dates are read from frontmatter here at config time (astro:content
// isn't available inside the config); this mirrors the approach used in the
// open-design landing astro.config. See docs/growth/seo-benchmark.md.
const BLOG_DIR = join(import.meta.dirname, 'src/content/blog');
const CHANGELOG_DIR = join(import.meta.dirname, 'src/content/changelog');

/** @type {Map<string, string>} pathname (trailing slash) → YYYY-MM-DD */
const blogLastmod = new Map();

/**
 * The newest vendored release date — /changelog's <lastmod>. Read here rather
 * than from astro:content for the same reason as the blog dates: content APIs
 * aren't available inside the config.
 * @returns {string | undefined} YYYY-MM-DD
 */
function latestReleaseDate() {
	const dates = readdirSync(CHANGELOG_DIR, { withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
		.map((entry) => readFileSync(join(CHANGELOG_DIR, entry.name), 'utf-8')
			.match(/^date:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1])
		.filter(Boolean)
		.sort();
	return dates.at(-1);
}
const changelogLastmod = latestReleaseDate();

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
	} else if (p === '/changelog/') {
		priority = 0.7;
		changefreq = 'weekly';
		if (changelogLastmod) item.lastmod = changelogLastmod;
	} else if (p === '/capabilities/') {
		priority = 0.9;
		changefreq = 'weekly';
	} else if (/^\/(compare|solutions|integrations)\/$/.test(p)) {
		priority = 0.8;
		changefreq = 'weekly';
	} else if (/^\/(solutions|integrations)\/[^/]+\/$/.test(p)) {
		priority = 0.7;
		changefreq = 'weekly';
	} else if (/^\/compare\/[^/]+\/$/.test(p)) {
		priority = 0.55;
		changefreq = 'monthly';
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
	// Cloudflare serves directory routes with a trailing slash. Make Astro's
	// generated links and canonical URLs use that same shape so crawlers are not
	// sent through avoidable 308 redirects before reaching the canonical page.
	trailingSlash: 'always',
	// `/github` → repo, preserving the old direct-to-GitHub habit (PRD §3 / §9).
	// In static output this emits a meta-refresh redirect page that works on any
	// host. A true HTTP 301 is set at the host during deploy (PRD §12 item 6) —
	// e.g. a Cloudflare Pages `_redirects` line: `/github https://github.com/open-multi-agent/open-multi-agent 301`.
	redirects: {
		'/github': 'https://github.com/open-multi-agent/open-multi-agent',
	},
	// Emit page CSS as <link rel="stylesheet"> chunks (Astro's default) instead of
	// inlining it into every page's <html>.
	//
	// This reverses an earlier 'always'. Inlining removed the render-blocking CSS
	// request and charged for it twice: no page could cache its stylesheet for the
	// next page, and the stylesheet sat in front of the content. 62KB of <style>
	// put the landing page's <h1> at byte 83,629 of 117,335 and a docs page's at
	// 127,144 of 210,350, so anything reading the HTML on a byte budget met
	// boilerplate first.
	//
	// Measured both settings, Lighthouse with simulated throttling, medians of 5
	// (mobile) / 3 (desktop), spread within a few ms per cell:
	//
	//   landing, mobile    FCP  907 → 1059ms   LCP 1580 → 1659ms
	//   landing, desktop   FCP  247 →  288ms   LCP  387 →  388ms
	//   docs,   mobile     FCP 1059 → 1357ms   LCP 1809 → 1957ms
	//
	// The landing figures are /zh/, not /: LangInit bounces a zh-locale browser off
	// `/` on first touch, and a client-side redirect inside the trace measures the
	// redirect, not the page. Same template, same CSS bundles, one stable URL.
	//
	// Against that: HTML halves — landing 117,335 → 58,548 bytes (27.4 → 14.6KB
	// gz), docs 210,350 → 126,248 (37.7 → 20.0KB gz), /404 87,401 → 22,128 — and
	// the <h1> moves to byte 24,842 and 43,042. So a first view pays ~0.1s of
	// mobile LCP, and every later page in the session ships half the HTML and
	// takes the CSS from cache instead of re-downloading it inside the markup.
	//
	// 'auto' rather than 'never': 'never' externalizes the small per-page sheets
	// too, turning the landing page's 2 render-blocking requests into 5 to move
	// about 3KB.
	build: { inlineStylesheets: 'auto' },
	// Blog posts (src/content/blog) render monochrome code blocks styled in
	// blog.css — disabling Astro's Shiki here keeps every code glyph at a
	// controlled >=4.5:1 contrast. Starlight docs use Expressive Code (configured
	// on the integration below), which this setting does not touch.
	// `rehypeChangelog` only touches src/content/changelog/*.md — it deepens the
	// vendored release-note headings by one and namespaces their ids by version,
	// so 19 releases can share one page without colliding anchors. It runs before
	// Astro's own heading-id pass, which leaves an existing id alone.
	markdown: { syntaxHighlight: false, rehypePlugins: [rehypeChangelog] },
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
			// `lastUpdated` is deliberately NOT enabled. It reads git during the build,
			// and Cloudflare Pages clones shallow — so in production it resolves every
			// page to the deploy commit rather than returning nothing. That would put a
			// wrong "Last updated" date in the docs footer on every deploy, and feed the
			// same wrong value to the JSON-LD.
			//
			// Docs dates come from the committed snapshot instead, generated from full
			// history by scripts/page-dates.mjs and consumed in StarlightHead.astro —
			// the same source the custom pages under src/pages/ use.
			// Keep docs chrome aligned with the custom pages. StarlightHead adds the
			// missing social image + JSON-LD; SocialIcons adds the locale-aware
			// enterprise pathway to desktop and mobile navigation; Footer mounts one
			// shared Chinese contact dialog after both triggers have rendered.
			components: {
				Head: './src/components/StarlightHead.astro',
				SocialIcons: './src/components/StarlightSocialIcons.astro',
				Footer: './src/components/StarlightFooter.astro',
			},
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
			// Reference is vendored from framework docs/ through the discovery +
			// exclusion sync model; Getting Started + Guides are maintained here.
			// Each label carries its zh-CN translation inline (Starlight's
			// SidebarItem.translations, keyed by `lang`). English labels stay as the
			// root-locale text; `slug` is locale-agnostic — Starlight resolves it to
			// docs/zh/<slug> when present, else falls back to the English page.
			sidebar: [
				{
					label: 'Getting Started',
					translations: { 'zh-CN': '入门指南' },
					items: [
						// Section landing page (getting-started/index.md). Without it /getting-started/
						// is a 404 — a URL people and agents reach by trimming a doc path.
						{ label: 'Overview', slug: 'getting-started', translations: { 'zh-CN': '总览' } },
						{ label: 'Introduction', slug: 'getting-started/introduction', translations: { 'zh-CN': '简介' } },
						{ label: 'Quick Start', slug: 'getting-started/quick-start', translations: { 'zh-CN': '快速开始' } },
						{ label: 'Choose a Run Mode', slug: 'getting-started/three-ways-to-run', translations: { 'zh-CN': '选择运行方式' } },
					],
				},
				{
					label: 'Guides',
					translations: { 'zh-CN': '指南' },
					items: [
						{ label: 'Overview', slug: 'guides', translations: { 'zh-CN': '总览' } },
						{ label: 'Orchestration Controls', slug: 'guides/orchestration-controls', translations: { 'zh-CN': '编排控制' } },
						{ label: 'Control costs & budgets', slug: 'guides/cost-budget-control', translations: { 'zh-CN': '控制成本与预算' } },
						{ label: 'Production Checklist', slug: 'guides/production-checklist', translations: { 'zh-CN': '生产清单' } },
					],
				},
				{
					// The /reference/ landing page. `slug: 'reference'` (no sub-path) is
					// also what keeps it out of the reference↔sidebar one-to-one check —
					// it indexes the pages below, it is not one of them.
					label: 'Reference overview',
					translations: { 'zh-CN': '参考总览' },
					slug: 'reference',
				},
				{
					label: 'Configure models & tools',
					translations: { 'zh-CN': '配置模型与工具' },
					items: [
						{ label: 'Providers', slug: 'reference/providers', translations: { 'zh-CN': '模型提供方' } },
						{ label: 'Tool configuration', slug: 'reference/tool-configuration', translations: { 'zh-CN': '工具配置' } },
						{ label: 'Structured input', slug: 'reference/structured-input', translations: { 'zh-CN': '结构化输入' } },
						{ label: 'External agents', slug: 'reference/external-agents', translations: { 'zh-CN': '外部智能体' } },
					],
				},
					{
						label: 'Control orchestration',
						translations: { 'zh-CN': '控制编排' },
						items: [
							{ label: 'Execution routing', slug: 'reference/execution-routing', translations: { 'zh-CN': '执行路由' } },
							{ label: 'Task scheduling', slug: 'reference/task-scheduling', translations: { 'zh-CN': '任务调度' } },
							{ label: 'Durable approval gates', slug: 'reference/durable-approvals', translations: { 'zh-CN': '持久化审批门' } },
							{ label: 'Consensus', slug: 'reference/consensus', translations: { 'zh-CN': '共识' } },
							{ label: 'Model routing', slug: 'reference/model-routing', translations: { 'zh-CN': '模型路由' } },
						{ label: 'Plan preview & replay', slug: 'reference/plan-replay', translations: { 'zh-CN': '计划预览与重放' } },
						{ label: 'Shared memory', slug: 'reference/shared-memory', translations: { 'zh-CN': '共享内存' } },
					],
				},
				{
					label: 'Operate reliably',
					translations: { 'zh-CN': '可靠运行' },
					items: [
						{ label: 'Observability', slug: 'reference/observability', translations: { 'zh-CN': '可观测性' } },
						{ label: 'Observability migration', slug: 'reference/observability-migration', translations: { 'zh-CN': '可观测性迁移' } },
						{ label: 'Observability performance', slug: 'reference/observability-performance', translations: { 'zh-CN': '可观测性性能' } },
						{ label: 'Run event journal', slug: 'reference/run-journal', translations: { 'zh-CN': '运行事件日志' } },
						{ label: 'Checkpoint & resume', slug: 'reference/checkpoint', translations: { 'zh-CN': '检查点与恢复' } },
						{ label: 'Adaptive recovery', slug: 'reference/adaptive-recovery', translations: { 'zh-CN': '自适应恢复' } },
						{ label: 'Context management', slug: 'reference/context-management', translations: { 'zh-CN': '上下文管理' } },
						{ label: 'Evaluation', slug: 'reference/evaluation', translations: { 'zh-CN': '评估' } },
						{ label: 'Egress policy', slug: 'reference/egress-policy', translations: { 'zh-CN': '出网策略' } },
					],
				},
				{
					label: 'CLI',
					translations: { 'zh-CN': 'CLI' },
					slug: 'reference/cli',
				},
			],
		}),
		// Emits sitemap-index.xml + sitemap-0.xml at the site root (PRD §4.6 GEO).
		// robots.txt already points crawlers at /sitemap-index.xml; this integration
		// is what generates it. Needs `site` (set above) to build absolute URLs.
		sitemap({ serialize: serializeSitemap }),
	],
});
