# FeeScope funding pipeline

Static per-venue funding feed for the `/funding/[symbol]` page. Funding rates
only change at settlement (8h for most pairs, 1h for Hyperliquid), so a
scheduled snapshot every 8 hours is maximally fresh — no runtime API calls, no
keys, no server.

## Data sources

Direct exchange public APIs (free, no keys), one endpoint per venue:

| Venue       | Endpoint |
|-------------|----------|
| OKX         | `GET https://www.okx.com/api/v5/public/funding-rate-history?instId={SYM}-USDT-SWAP&limit=100` |
| MEXC        | `GET https://contract.mexc.com/api/v1/contract/funding_rate/history?symbol={SYM}_USDT&page_size=100` |
| Hyperliquid | `POST https://api.hyperliquid.xyz/info` body `{"type":"fundingHistory","coin":"ETH","startTime":<ms 30d ago>}` (hourly) |
| Gate.io     | `GET https://api.gateio.ws/api/v4/futures/usdt/funding_rate?contract={SYM}_USDT&limit=100` |
| Bitget      | `GET https://api.bitget.com/api/v3/market/history-fund-rate?symbol={SYM}USDT&category=USDT-FUTURES&pageSize=100` |

Fetched symbols: `ETH`, `BTC`, `SOL`, `XRP`, `DOT`.

**Removed venues:** Binance and Bybit were removed because their public APIs
geo-block cloud infrastructure (GitHub Actions runners and Cloudflare Workers
edge IPs both get `403/451`). Bitfinex was considered but skipped due to the
FRR vs CURRENT_FUNDING ambiguity. Crypto.com was considered but skipped because
its funding interval could not be verified from the public API (the valuation
stream samples every 60 s, not at settlement).

## Refresh cadence

GitHub Actions (`.github/workflows/fetch-funding.yml`) runs on
`cron: "5 */8 * * *"` — every 8 hours at :05, offset 5 minutes past the
settlement boundary so each venue has published its latest rate. The job
commits `src/data/funding.json` only when it changed, and the commit triggers
the Cloudflare Pages rebuild via the existing Git integration.
`workflow_dispatch` allows a manual run.

## Normalization rules

- **Interval** — MEXC returns `collectCycle` (hours) directly; OKX/Gate.io/
  Bitget/Hyperliquid derive the interval as the median gap between consecutive
  settlement timestamps. Gate.io returns seconds — the fetcher multiplies by
  1000 to normalize to ms.
- **APR** — `apr = ((1 + rate) ** ((24 / interval_h) * 365) - 1) * 100`.
- **Net APR** — subtracts a same-day round-trip taker fee:
  - `net_apr_short = apr - (taker_bps * 2 * (365 / holding_days) / 100)`
  - `net_apr_long  = -(apr + taker_bps * 2 * (365 / holding_days) / 100)`
  - `holding_days = 1` (round-trip same-day); taker bps mirror `src/data/fees.ts`
    (OKX 5.0, MEXC 6.0, Hyperliquid 3.5, Gate.io 5.0, Bitget 6.0).
- **Stability** — `score = same-sign settlements among the last 30 / 30`, where
  "sign" is the sign of the latest rate. `STABLE ≥ 0.8`, `MODERATE ≥ 0.5`,
  `VOLATILE` otherwise.
- **Error handling** — a venue whose fetch fails is written as `null` for that
  symbol and the run continues; the page renders "—" for that row.

## Output shape

`src/data/funding.json`:

```json
{
  "generated_at": "2026-10-06T09:50:00Z",
  "symbols": {
    "ETH": {
      "venues": {
        "okx": { "rate": 0.00003503, "interval_h": 8.0, "apr": 3.91,
                 "net_apr_short": -32.59, "net_apr_long": -40.41,
                 "settled_at": "...", "mark_price": null },
        "hyperliquid": { "rate": 0.0000125, "interval_h": 1.0, "apr": 11.57, "...": "..." }
      },
      "stability": { "okx": { "positive_days": 27, "total_days": 30, "score": 0.9 } }
    }
  }
}
```

The page (`src/lib/funding-analysis.ts`) imports this JSON at build time; no fee
or APR math runs at render time.

## Adding a venue or symbol

- **New venue** — add its endpoint to `scripts/fetch-funding.py` (the `urls`
  dict or a POST branch, a `parse_history` branch, and a `TAKER_FEE_BPS` entry),
  add its display label to `VENUE_LABEL` and fee to `VENUE_TAKER_BPS` in
  `src/lib/funding-analysis.ts`, add it to `src/data/fees.ts`, and re-run the
  fetcher.
- **New symbol** — append it to `SYMBOLS` in the fetcher and re-run. The dynamic
  route `/funding/[symbol]` picks it up automatically.
- After either change, run `python3 scripts/fetch-funding.py` once and confirm
  the diff in `src/data/funding.json`.
