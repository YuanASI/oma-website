# OMA — DESIGN.md

> **Brand contract for open-multi-agent.com.** This document is the single source of *visual intent*; `src/styles/tokens.css` is its machine form. Benchmarked to the craft tier of **open-design.ai** — in OMA's **own** identity, not a copy. Everything here is meant to be *bound* when building a page (the way an Open Design system's `DESIGN.md` is bound at generation time).
>
> Status: **draft, 2026-07-09.** One decision is still open — see §0.

---

## 0. The one open decision — surface

**Dark (primary)** vs **Paper (light alternate).** Everything in this contract is invariant to that choice *except* the palette in §3, which ships **both** token sets. Pick the primary surface and the rest is a one-line switch.

- **Dark** — keeps OMA's near-black equity, developer-native, the real-run DAG hero reads best on it, and it's lower-risk. *Recommended default.*
- **Paper** — warm light/editorial, maximum distance from the crowd of dark agent-frameworks, closest to open-design.ai's own feel; bolder, but the DAG hero must be redesigned for a light ground and it risks reading as "their neighbour."

> Decision owner: Jack. Until set, build against **Dark**.

---

## 1. Thesis

OMA is a **TypeScript multi-agent orchestration framework**. The site should feel like **infrastructure built by people who ship** — warm, exact, quietly confident, developer-native — *not* a generic dark AI tool with a neon accent.

The signature is **truth, not decoration**: an actual `runTeam()` run, decomposed into a task DAG, rendered as the hero. The product's real output *is* the art direction. Everything else is set so that one true thing lands.

---

## 2. What we keep · what we level up

**Keep (real assets — do not throw away):**
- Warm temperature (warm near-black / bone, not cool grey).
- **Emerald** green as the one accent.
- Mono type for data / terminal / code.
- The real-run **DAG hero**.
- Dark-first as an option.

**Level up (this is the whole point — the gap vs open-design.ai):**
1. A **characterful display typeface** with **italic emphasis** — currently OMA uses neutral Geist for everything; that reads "safe/default."
2. An **editorial type scale** — bigger, more confident display; real hierarchy.
3. **Choreographed reveal motion** — a word-by-word hero reveal, staggered section reveals. One orchestrated moment, not scattered effects.
4. **Tactile surfaces** — warm soft shadows, a faint engineered grid, one slightly-tilted artifact card.
5. **One confident accent, used with discipline** (§3.3).

**Explicitly NOT (differentiation guardrails):**
- Do **not** adopt open-design's lime (`#63fe13`) — OMA stays **emerald**. Same green *family*, distinct *hue*.
- Do **not** ship their typeface (Albert Sans) as OMA's face — pick our own (§4). Same league of craft, our own voice.

---

## 3. Palette

Grounded in the current `src/styles/tokens.css` (warm, dark-first), with the emerald made **more confident** than today's flat `#10B981`. Warm-biased neutrals throughout — no pure/cool greys.

### 3.1 Dark (primary)

| Token | Hex | Role |
|---|---|---|
| `--canvas` | `#0C0B0A` | page / hero ground (warm near-black) |
| `--raised` | `#141210` | raised surface |
| `--card` | `#1A1714` | cards |
| `--well` | `#221E19` | code / sunken well |
| `--ink` | `#F5F1E8` | primary text (bone) |
| `--ink-2` | `#A79F94` | body / secondary |
| `--ink-3` | `#857E72` | faint / labels |
| `--line` | `#2A2620` | default hairline |
| `--line-2` | `#1F1B17` | softest divider |
| `--accent` | `#13C176` | emerald — confident (↑ from `#10B981`) |
| `--accent-ink` | `#34D48C` | emerald for text/links on dark |
| `--accent-on` | `#06170F` | text on an emerald fill |
| `--accent-tint` | `rgba(19,193,118,.13)` | tint fill |

### 3.2 Paper (light alternate)

| Token | Hex | Role |
|---|---|---|
| `--canvas` | `#F5F1E8` | warm paper ground |
| `--raised` | `#FBF8F1` | raised warm |
| `--card` | `#FFFFFF` | white card |
| `--well` | `#F1ECE0` | code / sunken well |
| `--ink` | `#17140F` | primary text (warm near-black) |
| `--ink-2` | `#565049` | body / secondary |
| `--ink-3` | `#8B857A` | faint / labels |
| `--line` | `#E6E0D2` | default hairline |
| `--line-2` | `#EFEADD` | softest divider |
| `--accent` | `#0FA968` | emerald fill (deeper — legible on light) |
| `--accent-ink` | `#0A7A4C` | emerald for **text** on light (AA) |
| `--accent-on` | `#FFFFFF` | text on an emerald fill |
| `--accent-tint` | `#E7F4EC` | tint fill |

### 3.3 Accent discipline

Emerald appears **at most ~3 times per viewport**: one display **emphasis** word, one **primary action**, one **live/status** signal. Everything else is warm neutral. **Semantic** colours (done = green, running = amber, failed = red) are a *separate* system from the accent and do not count against it.

Shadows are **warm** (based on `rgba(44,34,18,…)`), never neutral black. Soft and large on Paper; on Dark, prefer hairline + a faint lift over heavy shadow.

---

## 4. Typography

The single biggest lever. Character lives in the **display** face; body stays clean; mono stays the terminal voice.

| Role | Face | Notes |
|---|---|---|
| **Display / headings** | **Bricolage Grotesque** *(recommended)* | Contemporary grotesque with real personality; OFL; **self-host via Fontsource**, same pipeline as today's Geist. Large sizes, tight tracking (`-0.03em` at hero). |
| **Emphasis** | **Fraunces** *italic* *(pairing)* | One italic word per headline — the "designed" move borrowed from open-design. Warm literary contrast to the grotesque. OFL. *(Alt: skip Fraunces and use Bricolage's own italic for a more uniform look.)* |
| **Body** | **Geist** *(keep)* | Already self-hosted, crisp Latin. Continuity + readability. |
| **Mono / data / code** | **JetBrains Mono** *(keep)* | The DAG / terminal / code voice. Also carries the CJK fallback chain (unchanged). |
| **CJK** | system stack *(unchanged)* | PingFang SC / Microsoft YaHei / Noto **after** the Latin faces — per-glyph resolution, no CJK webfont downloaded. |

**Scale (fluid):** hero display `clamp(2.7rem, 6.6vw, 4.9rem)` · section h2 `clamp(1.9rem, 4vw, 3rem)` · big numeral markers `clamp(2.4rem, 5vw, 4rem)` (weight 300) · lead `~1.15rem` · body `1rem/1.55` · mono label `0.78rem` uppercase, `+0.14em` tracking.

**Rules:** headings use the display face — never `system-ui`. Give headings `text-wrap: balance` and body a ~46–52ch measure. Uppercase mono labels get letter-spacing. Numerals in tables/DAG use `tabular-nums`.

> Font choice is a decision point — Bricolage is the recommendation; the visual specimen (companion artifact) lets you judge it and the Fraunces-italic pairing directly.

---

## 5. Motion

One **orchestrated** moment; quiet everywhere else. Over-animation reads as AI-generated — resist it.

- **Hero headline:** word-by-word **blur + rise reveal** on load, ~75 ms stagger, ~0.7 s each.
- **Sections:** reveal-on-scroll (fade + 16 px rise), stagger capped at ~240 ms.
- **Status:** running DAG node **pulses**; done is static.
- **Hover:** buttons lift 1 px; the DAG artifact card settles from a `-0.5deg` tilt to flat. Nothing else moves.
- **Discipline:** no parallax, no scroll-jacking, no scattered hover confetti.
- **`prefers-reduced-motion: reduce` → final state, zero motion.** Non-negotiable.

---

## 6. Space & layout

- Container `max-width: 1080–1160px`; page padding `clamp(18px, 4vw, 40px)`.
- Fine-grained spacing scale (`2/4/6/8/10/12/16/20/24/32/40/56/72/96…`).
- **Editorial rhythm** — generous section gaps (`clamp(56px, 9vw, 104px)`).
- **Faint warm grid** on the canvas (`radial-gradient` dots, ~0.035 alpha) — an OMA signature, kept subtle.
- **Tactile cards:** warm soft shadow on Paper; hairline + slight lift on Dark. The **hero DAG artifact** may sit at a `-0.5deg` tilt (physicality — used **once**, not everywhere).

---

## 7. Component vocabulary

These restyle the existing `src/components/ds/*` (`Badge`, `Callout`, `Card`, `CodeBlock`, `TaskNode`) to this contract — **restyle, not replace**.

- **Nav** — wordmark + geometric SVG mark (emerald inner), text links, one ghost "Star", one primary "Quick Start". Warm glass on scroll.
- **Buttons** — primary = accent fill (Dark) / on Paper the primary may be **ink-black** with accent reserved for links (Vercel-style discipline); ghost = hairline border. Radius `10–12px`.
- **DAG artifact** *(the star)* — a `--card` panel: goal line (`team.ts · goal "…"`), a `runTeam() · model` live tag, then task **nodes** (mono `#id`, title, `assignee`, status **pill** with dot, `parallel` tag). Optional `-0.5deg` tilt. This is where craft is judged.
- **Capability cards** — numbered (`01/02/03` — only because the content is genuinely a set), tactile, hover-lift.
- **Reliability chips** — pill, accent-tint fill, accent dot, mono label.
- **Code** — `--well` block, mono, accent for keywords, muted for comments, `overflow-x:auto`.
- **Icons** — 1.6px-stroke monoline SVG, `currentColor`. **Never emoji as feature icons.**

---

## 8. Anti-slop (from open-design's `craft/anti-ai-slop.md`, OMA-tuned)

- ❌ Tailwind indigo (`#6366f1` & friends) as accent. OMA's accent is emerald — use `--accent`.
- ❌ Two-stop purple→blue / blue→cyan "trust" gradient on the hero. Flat warm ground + intentional type wins.
- ❌ Emoji as feature/section icons — monoline SVG instead.
- ❌ Display text in `system-ui`/Inter when the contract binds a display face.
- ❌ Rounded card with a coloured left-border rail (the canonical "AI dashboard tile").
- ❌ Everything centered; `rounded-lg` on everything.
- ✅ **Numbers are never hardcoded** (OMA rule): stars/forks/contributors/examples are build-time fetched with a magnitude fallback — never a hand-typed figure presented as a live claim.

---

## 9. Voice (copy is design material)

PM-recognizable, active, developer-honest. Name things by what they do (`runTeam()`, "task DAG", "stay in the loop"), not by marketing abstraction. A control says exactly what happens. No "unleash the power of," no apology, no fluff. Specific beats clever.

---

## 10. Constraints / provenance

- **Benchmarked to** open-design.ai (their *craft*, OMA's *identity*). OMA keeps emerald (not lime) and its own display face (not Albert Sans).
- **Fonts:** OFL, **self-hosted** via Fontsource/local — **no CDN** (CSP + offline, per current setup).
- **i18n:** en at root, zh at `/zh/`. The display face must cover the needed Latin weights; **CJK stack is unaffected** (resolves per-glyph after Latin).
- **Real hero-run preserved** — the DAG hero renders a real captured `runTeam()` run (`src/data/hero-run*.json`), never a hand-built mockup.
- **Implementation:** land against `src/styles/tokens.css` + `landing.css` + `src/components/ds/*`. Clear `.astro` cache after token edits. **PR, never push to main.**

---

*Companion: a visual specimen artifact renders this contract — real palette swatches, the display/emphasis faces embedded, and the component vocabulary — so the type and colour choices can be judged directly before implementation.*
