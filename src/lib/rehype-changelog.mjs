// Rehype pass for the vendored release notes only (src/content/changelog/*.md).
//
// /changelog renders all 19 releases on one page, so two things have to be fixed
// up at the markdown layer:
//   1. Heading level — each release sits under the page's <h2> version heading,
//      so the body's own `## Section` must render one level deeper to keep the
//      document outline valid.
//   2. Heading ids — every release body has an "Install" and a "Packages"
//      section. Left alone, 19 files each slug to `#install` and the page ships
//      duplicate ids. Prefixing with the version (`#v1-14-0-install`) makes them
//      unique and gives each section a stable, linkable anchor.
//
// Astro applies user rehype plugins BEFORE its own rehypeHeadingIds, which only
// slugs headings that don't already carry an id — so setting ids here wins.
// Every other markdown file in the project passes through untouched.
import Slugger from 'github-slugger';

const CHANGELOG_PATH = /[/\\]src[/\\]content[/\\]changelog[/\\]([^/\\]+)\.md$/;

/** `1.14.0` → `v1-14-0`, the id prefix and the release's own section anchor. */
export const releaseAnchor = (version) => `v${String(version).replace(/\./g, '-')}`;

export function rehypeChangelog() {
	return function transform(tree, file) {
		const version = (file?.history?.[0] ?? file?.path ?? '').match(CHANGELOG_PATH)?.[1];
		if (!version) return;

		const prefix = releaseAnchor(version);
		const slugger = new Slugger();
		visit(tree);

		function visit(node) {
			for (const child of node.children ?? []) {
				const level = child.type === 'element' && /^h([1-6])$/.exec(child.tagName ?? '')?.[1];
				if (level) {
					// h6 has nowhere deeper to go; it still gets a prefixed id.
					child.tagName = `h${Math.min(Number(level) + 1, 6)}`;
					child.properties = child.properties || {};
					child.properties.id = `${prefix}-${slugger.slug(textOf(child))}`;
				}
				visit(child);
			}
		}
	};
}

function textOf(node) {
	if (node.type === 'text') return node.value;
	return (node.children ?? []).map(textOf).join('');
}
