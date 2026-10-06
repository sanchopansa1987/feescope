# content-site

The live fee + funding comparison tool. Phase 1 is an Astro prototype serving
historical frozen funding data and a fee calculator, with the measurement /
redirect / i18n / regeneration spine baked in.

## Run locally

```bash
cd content-site
npm install
npm run dev        # Astro dev server, default http://localhost:4321
```

## Build

```bash
npm run build      # SSR output (dist/) via @astrojs/node
npm run preview    # preview the build
```

## How the frozen data feeds the site

1. The research pipeline froze perp funding history to
   `backtest/cache/frozen/2026-10-05-funding/` (pandas pickle + `manifest.json`).
2. Node/Astro cannot read pickle, so `scripts/export-funding.py` reads the
   manifest + per-symbol pickles and writes `src/data/funding-snapshot.json`.
3. `src/data/funding.ts` imports that JSON and exposes a typed `fundingRows`;
   `/funding-rates` renders it server-side.

Regenerate (or re-run after a re-freeze):

```bash
npm run regenerate   # runs pages-manifest.json's rebuild command
```

## Structure

- **Measurement** — `src/lib/analytics.ts` appends pageviews/clicks to
  `.analytics/*.jsonl` (gitignored). The layout logs every render server-side.
- **Redirects** — `/go/[exchange]` logs the click and 302-redirects to the URL
  in `config/affiliates.ts` (`"#"` placeholders → falls back to `/`).
- **i18n** — `src/lib/strings.ts` (en only), `locale` field on content
  collections, unused `src/lib/hreflang.ts`.
- **Auto-regeneration** — `pages-manifest.json` + `src/lib/regenerate.ts`.

## Pages

- `/` — home
- `/funding-rates` — sortable funding table (10 symbols)
- `/fees` — live fee calculator
- `/about` — positioning
- `/go/[exchange]` — click-logging redirect
- 404

## Phase 2 (planned)

Cloudflare Pages deploy (adapter switch + KV/D1 analytics sink), live Bybit
funding feed, real affiliate links, and articles.
