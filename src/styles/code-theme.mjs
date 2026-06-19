// ─────────────────────────────────────────────────────────────────────────
//  Open Multi-Agent · Expressive Code syntax themes
//  OMA syntax palette for the docs' code blocks, mirroring the landing
//  CodeBlock (src/components/ds/CodeBlock.astro): blue keywords, emerald
//  strings, amber numbers, muted-italic comments, on the warm-dark canvas.
//
//  These themes define ONLY the syntax token hues. The code-block frame
//  (background, title bar, tabs, copy button, scrollbars) is supplied by
//  Starlight's `useStarlightUiThemeColors`, which maps it to the --sl-color-*
//  vars in starlight-theme.css — i.e. the warm-dark #232119 well (--oma-bg-3)
//  in dark mode. So nothing here touches the frame; we only recolor tokens.
//
//  Tokens not in the four buckets below fall back to `base` (editor.foreground),
//  matching the landing's restrained, mostly-monochrome look. Wired up with
//  `minSyntaxHighlightingColorContrast: 0` in astro.config.mjs so EC renders
//  these hues exactly (no automatic contrast lightening).
// ─────────────────────────────────────────────────────────────────────────

/**
 * Build a minimal Expressive Code / VS Code theme from the OMA palette.
 * @param {object} p
 * @param {'dark'|'light'} p.type   color mode (drives Starlight's theme switch)
 * @param {string} p.bg             editor background (overridden by Starlight UI colors)
 * @param {string} p.base           default token / identifier foreground
 * @param {string} p.keyword        keywords, storage, language constants
 * @param {string} p.string         string literals
 * @param {string} p.number         numeric literals
 * @param {string} p.comment        comments (rendered italic)
 */
function omaTheme({ type, bg, base, keyword, string, number, comment }) {
  return {
    name: `oma-${type}`,
    type,
    colors: {
      'editor.background': bg,
      'editor.foreground': base,
    },
    settings: [
      {
        scope: ['comment', 'punctuation.definition.comment'],
        settings: { foreground: comment, fontStyle: 'italic' },
      },
      {
        scope: ['string', 'punctuation.definition.string', 'string.template'],
        settings: { foreground: string },
      },
      {
        scope: ['constant.numeric', 'constant.character.numeric'],
        settings: { foreground: number },
      },
      {
        scope: ['keyword', 'storage', 'constant.language', 'variable.language'],
        settings: { foreground: keyword },
      },
      // Operators stay at base — the landing leaves `=`, `=>`, `+` uncolored.
      { scope: ['keyword.operator'], settings: { foreground: base } },
    ],
  };
}

// Dark — the primary OMA experience; hues are the exact landing palette.
export const omaDark = omaTheme({
  type: 'dark',
  bg: '#232119', //   --oma-bg-3   (frame is re-supplied by Starlight UI colors)
  base: '#A09A8E', // --oma-fg-1   matches the landing CodeBlock <pre> color
  keyword: '#60A5FA', // --oma-info
  string: '#10B981', //  --oma-accent
  number: '#F59E0B', //  --oma-warning
  comment: '#726C62', // --oma-fg-2
});

// Light — a first-pass warm palette (full light mode is a later effort, see
// starlight-theme.css). Deeper hues keep contrast on the light background.
export const omaLight = omaTheme({
  type: 'light',
  bg: '#F6F7F9',
  base: '#3A3731', //    --oma-border-2 (warm near-black on light)
  keyword: '#2563EB',
  string: '#047857',
  number: '#B45309',
  comment: '#6B7280',
});
