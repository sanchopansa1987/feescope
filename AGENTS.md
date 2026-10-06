# content-site — agent guide

## Purpose

`content-site/` is the content + API surface of the three-stream autonomous-income
experiment. It is **not** a crypto blog. It is "the live fee + funding comparison
tool that also explains the math."

## Positioning (non-negotiable)

- The **tool is the product**. The `/funding-rates` and `/fees` pages are the
  moat; prose exists only to support them.
- Google rewards **live unique data**, not AI prose. Never produce an article
  that is just rewritten generic content — it will not rank.
- Phase 1 is a prototype: historical frozen data, no live feeds, no real
  affiliate links, no articles.

## Three-stream relationship

1. **Stream 1 (this site)** — content + affiliate. Active in Phase 1.
2. **Stream 2 (free API)** — a thin value-add (funding/fee data) used as a lead
   magnet; the data layer here is its foundation.
3. **Stream 3 (trading)** — the `research/edge-discovery/` pipeline. **Dormant**
   until it validates an edge. This site must not depend on it and must not
   touch it.

## Structure (baked in — do not bypass)

- **Measurement spine** — `src/lib/analytics.ts` (`logPageview`, `logClick`)
  appends to `.analytics/*.jsonl` (server-side, Node fs; Phase 2 moves to
  Cloudflare KV/D1). The layout calls `logPageview` on every render.
- **`/go/[exchange]`** — `src/pages/go/[exchange].ts` logs the click then
  redirects; target URLs come from `config/affiliates.ts` (`"#"` placeholders).
- **i18n-ready** — all user-facing strings live in `src/lib/strings.ts` keyed by
  locale (en only). Content collections carry a `locale` field. `hreflang.ts`
  exists but is unused. Never hardcode a string in a component.
- **Auto-regeneration** — `pages-manifest.json` declares data-driven pages and
  their rebuild command; `src/lib/regenerate.ts` runs them (`npm run regenerate`).
  Adding a data page = a manifest entry, not new code.

## Rules

- **Scope:** touch only `content-site/`. Never modify the trading pipeline,
  `backtest/`, `agent/`, `bybit_agent.py`, or the frozen datasets.
- **No hardcoded numbers/strings in components** — data from `src/data/`, strings
  from `src/lib/strings.ts`, affiliate URLs from `config/affiliates.ts`.
- **Data flow:** frozen funding is pickle, which Node cannot read.
  `scripts/export-funding.py` → `src/data/funding-snapshot.json` →
  `src/data/funding.ts`. Re-run the export (or `npm run regenerate`) after a
  re-freeze.
- **Stack:** Astro (SSR via `@astrojs/node` for local dev), TypeScript,
  Tailwind v4. `wrangler.toml` is a placeholder — no deploy in Phase 1.
- **No deploy, no domain, no live exchange calls, no real affiliate links** in
  Phase 1.

## Phase 2 (not yet)

Cloudflare Pages deploy (`@astrojs/cloudflare` adapter + KV/D1 analytics sink),
live Bybit funding feed, real affiliate links with disclosure, and articles.
