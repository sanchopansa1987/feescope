# FeeScope funding pipeline

Static per-venue funding feed for the `/funding/[symbol]` page. Funding rates
only change at settlement (8h for most pairs, 4h/1h for some), so a scheduled
snapshot every 8 hours is maximally fresh — no runtime API calls, no keys, no
server.

## Data sources

Direct exchange public APIs (free, no keys), one endpoint per venue:

| Venue  | Endpoint                                                                   |
|--------|----------------------------------------------------------------------------|
| Binance| `GET https://fapi.binance.com/fapi/v1/fundingRate?symbol={SYM}USDT&limit=100` |
| Bybit  | `GET https://api.bybit.com/v5/market/funding/history?category=linear&symbol={SYM}USDT&limit=200` |
| OKX    | `GET https://www.okx.com/api/v5/public/funding-rate-history?instId={SYM}-USDT-SWAP&limit=100` |
| MEXC   | `GET https://contract.mexc.com/api/v1/contract/funding_rate/history?symbol={SYM}_USDT` |

Fetched symbols: `ETH`, `BTC`, `SOL`, `XRP`, `DOT`.

## Refresh cadence

GitHub Actions (`content-site/../.github/workflows/fetch-funding.yml`) runs on
`cron: "5 */8 * * *"` — every 8 hours at :05, offset 5 minutes past the
settlement boundary so each venue has published its latest rate. The job
commits `src/data/funding.json` only when it changed (`[skip ci]`), and the
commit triggers the Cloudflare Pages rebuild via the existing Git integration.
`workflow_dispatch` allows a manual run.

## Normalization rules

- **Interval** — MEXC returns `collectCycle` (hours) directly; Binance/Bybit/OKX
  derive the interval as the median gap between consecutive settlement
  timestamps. The task never hardcodes "3 periods/day".
- **APR** — `apr = ((1 + rate) ** ((24 / interval_h) * 365) - 1) * 100`.
- **Net APR** — subtracts a same-day round-trip taker fee:
  - `net_apr_short = apr - (taker_bps * 2 * (365 / holding_days) / 100)`
  - `net_apr_long  = -(apr + taker_bps * 2 * (365 / holding_days) / 100)`
  - `holding_days = 1` (round-trip same-day); taker bps mirror `src/data/fees.ts`
    (Binance 4.0, Bybit 5.5, OKX 5.0, MEXC 6.0).
- **Stability** — `score = same-sign settlements among the last 30 / 30`, where
  "sign" is the sign of the latest rate. `STABLE ≥ 0.8`, `MODERATE ≥ 0.5`,
  `VOLATILE` otherwise.
- **Error handling** — a venue whose fetch fails is written as `null` for that
  symbol and the run continues; the page renders "—" for that row.

## Output shape

`src/data/funding.json`:

```json
{
  "generated_at": "2026-10-06T03:11:27Z",
  "symbols": {
    "ETH": {
      "venues": {
        "binance": { "rate": 0.00008972, "interval_h": 8.0, "apr": 10.32,
                     "net_apr_short": -18.88, "net_apr_long": -39.52,
                     "settled_at": "...", "mark_price": 2390.91 },
        "bybit": { "...": "..." }
      },
      "stability": { "binance": { "positive_days": 27, "total_days": 30, "score": 0.9 } }
    }
  }
}
```

The page (`src/lib/funding-analysis.ts`) imports this JSON at build time; no fee
or APR math runs at render time.

## Adding a venue or symbol

- **New venue** — add its endpoint to `scripts/fetch-funding.py` (the `urls`
  dict, a `parse_history` branch, and a `TAKER_FEE_BPS` entry), add its display
  label to `VENUE_LABEL` in `src/lib/funding-analysis.ts`, and re-run the fetcher.
- **New symbol** — append it to `SYMBOLS` in the fetcher and re-run. The dynamic
  route `/funding/[symbol]` picks it up automatically.
- After either change, run `python3 scripts/fetch-funding.py` once and confirm
  the diff in `src/data/funding.json`.
