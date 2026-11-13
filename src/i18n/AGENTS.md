# AGENTS.md — `src/i18n/`

Applies to the custom-page dictionaries and routing helpers. The root
`AGENTS.md` still applies.

- `en.ts` is the source of truth; `zh.ts` must remain key-for-key compatible.
- Add every user-facing string for a custom page to both `en.ts` and `zh.ts`;
  do not fork separate `zh` page templates under `src/pages/`.
- Follow `TRANSLATING.md` for terminology and text that must remain unchanged.
