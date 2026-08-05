// Title and meta-description length discipline.
//
// Google truncates SERP titles and descriptions by rendered pixel width, not
// character count, so the usual "60 / 160 characters" advice is really a width
// budget that happens to be quoted in Latin characters. A CJK glyph occupies
// roughly two Latin character widths, which is why `width()` weights it as two
// and every limit here is expressed in those units. A 40-character Chinese
// description is not "short" — it is about as wide as an 80-character English
// one.
//
// scripts/check-meta-lengths.mjs enforces the same budgets against the built
// HTML, so a page that drifts past them fails CI instead of quietly shipping a
// truncated snippet.

/** SERP title budget, in Latin-character width units. */
export const TITLE_MAX = 60;
/** SERP meta-description budget, in Latin-character width units. */
export const DESC_MAX = 160;

/**
 * Rendered width in Latin-character units. CJK ideographs, kana, and
 * full-width punctuation count double; everything else counts as one.
 */
export function width(text: string): number {
  let w = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0) ?? 0;
    const wide =
      (c >= 0x1100 && c <= 0x115f) || // Hangul Jamo
      (c >= 0x2e80 && c <= 0xa4cf) || // CJK radicals … Yi
      (c >= 0xac00 && c <= 0xd7a3) || // Hangul syllables
      (c >= 0xf900 && c <= 0xfaff) || // CJK compatibility ideographs
      (c >= 0xfe30 && c <= 0xfe4f) || // CJK compatibility forms
      (c >= 0xff00 && c <= 0xff60) || // full-width forms
      (c >= 0xffe0 && c <= 0xffe6) ||
      (c >= 0x20000 && c <= 0x3fffd); // CJK extension planes
    w += wide ? 2 : 1;
  }
  return w;
}

/**
 * Trim to a width budget on a word boundary, appending an ellipsis when
 * anything was actually removed. Latin text breaks at spaces; CJK has no word
 * spaces, so it falls back to a hard cut, which is how it reads anyway.
 *
 * For text that is auto-derived (an example's JSDoc intent, say) this is the
 * right tool. Hand-written marketing copy should be rewritten to fit instead —
 * an ellipsis in a comparison-page description throws away the differentiator
 * that made the sentence worth writing.
 */
export function clamp(text: string, max: number): string {
  if (width(text) <= max) return text;
  // Reserve one unit for the ellipsis.
  const budget = max - 1;
  let out = '';
  let w = 0;
  for (const ch of text) {
    const next = w + width(ch);
    if (next > budget) break;
    out += ch;
    w = next;
  }
  const lastSpace = out.lastIndexOf(' ');
  // Only break on a space when one sits reasonably near the end; otherwise the
  // text is CJK (no spaces) or one very long token, and a hard cut is correct.
  if (lastSpace > budget * 0.6) out = out.slice(0, lastSpace);
  return out.trimEnd().replace(/[,;:—-]$/, '') + '…';
}

/**
 * Join a page title with its brand suffix, dropping the suffix when the base
 * title alone already fills the budget.
 *
 * The alternative — always appending — is what pushed 44 pages past the limit:
 * a descriptive 90-character recipe title plus " — Open Multi-Agent example"
 * guarantees Google cuts the part that carries the meaning and keeps none of
 * the brand it was cut for.
 */
export function withSuffix(base: string, suffix: string, max: number = TITLE_MAX): string {
  if (width(base) + width(suffix) <= max) return base + suffix;
  if (width(base) <= max) return base;
  return clamp(base, max);
}
