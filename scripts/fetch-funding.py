#!/usr/bin/env python3
"""Fetch per-venue funding rates from 4 exchanges and write funding.json.

Static pipeline: run on schedule (see .github/workflows/fetch-funding.yml),
commit the JSON, and let Cloudflare Pages rebuild. No runtime API calls.

Normalization:
  - apr = ((1 + rate) ** ((24 / interval_h) * 365) - 1) * 100
  - net_apr_short = apr - (taker_bps * 2 * (365 / holding_days) / 100)
  - net_apr_long  = -(apr + taker_bps * 2 * (365 / holding_days) / 100)
  - stability.score = same-sign settlements among last N / N

Per-venue errors are tolerated: a failed venue is written as null and the
run continues.
"""

import json
import os
import statistics
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

SYMBOLS = ["ETH", "BTC", "SOL", "XRP", "DOT"]
HOLDING_DAYS = 1
STABILITY_N = 30
LIMIT = 100

# Cloudflare Worker proxy for exchanges that geo-block datacenter IPs
# (GitHub Actions runners). Only Bybit is routed through it — Binance also
# blocks Cloudflare edge IPs, so Binance stays direct.
PROXY_URL = "https://feescope-fetch-proxy.sanchopansa1987.workers.dev"

# VIP-0 futures taker fee per side, in basis points. Single source of truth is
# src/data/fees.ts — keep these in sync.
TAKER_FEE_BPS = {
    "binance": 4.0,
    "bybit": 5.5,
    "okx": 5.0,
    "mexc": 6.0,
}

UA = {"User-Agent": "FeeScope/1.0 (+https://feescope.pages.dev)"}


def http_get_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def interval_hours_from_timestamps(timestamps_ms):
    """Median gap between consecutive settlement times, in hours."""
    if len(timestamps_ms) < 2:
        return None
    gaps = [b - a for a, b in zip(sorted(timestamps_ms)[:-1], sorted(timestamps_ms)[1:])]
    if not gaps:
        return None
    med = statistics.median(gaps)
    return round(med / 3_600_000, 2)


def parse_history(exchange, payload):
    """Return (entries, interval_h). entries = [(ts_ms, rate_float, mark_price|None)] newest-first."""
    entries = []
    interval_h = None
    try:
        if exchange == "binance":
            rows = [r for r in payload if r.get("rateType", "Regular") == "Regular"]
            for r in rows:
                entries.append((int(r["fundingTime"]), float(r["fundingRate"]),
                                float(r["markPrice"]) if r.get("markPrice") else None))
            interval_h = interval_hours_from_timestamps([e[0] for e in entries])
        elif exchange == "bybit":
            for r in payload.get("result", {}).get("list", []):
                entries.append((int(r["fundingRateTimestamp"]), float(r["fundingRate"]), None))
            interval_h = interval_hours_from_timestamps([e[0] for e in entries])
        elif exchange == "okx":
            for r in payload.get("data", []):
                entries.append((int(r["fundingTime"]), float(r["fundingRate"]), None))
            interval_h = interval_hours_from_timestamps([e[0] for e in entries])
        elif exchange == "mexc":
            for r in payload.get("data", {}).get("resultList", []):
                entries.append((int(r["settleTime"]), float(r["fundingRate"]), None))
                if interval_h is None and r.get("collectCycle"):
                    interval_h = float(r["collectCycle"])
            if interval_h is None:
                interval_h = interval_hours_from_timestamps([e[0] for e in entries])
    except (KeyError, TypeError, ValueError, IndexError) as e:
        print(f"  ! parse error for {exchange}: {e}", file=sys.stderr)
    entries.sort(key=lambda e: e[0], reverse=True)
    return entries, interval_h


def venue_block(exchange, sym, payload):
    entries, interval_h = parse_history(exchange, payload)
    if not entries or interval_h is None:
        return None
    latest_ts, latest_rate, mark_price = entries[0]
    periods_per_year = (24 / interval_h) * 365
    apr = ((1 + latest_rate) ** periods_per_year - 1) * 100

    fee = TAKER_FEE_BPS[exchange]
    round_trip_apr = fee * 2 * (365 / HOLDING_DAYS) / 100
    net_apr_short = apr - round_trip_apr
    net_apr_long = -(apr + round_trip_apr)

    window = entries[:STABILITY_N]
    same_sign = sum(1 for _, r, _ in window if (r >= 0) == (latest_rate >= 0))
    stability_score = same_sign / len(window)
    positive_days = sum(1 for _, r, _ in window if r >= 0)

    settled_at = datetime.fromtimestamp(latest_ts / 1000, tz=timezone.utc).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )
    return {
        "rate": latest_rate,
        "interval_h": interval_h,
        "apr": round(apr, 4),
        "net_apr_short": round(net_apr_short, 4),
        "net_apr_long": round(net_apr_long, 4),
        "settled_at": settled_at,
        "mark_price": mark_price,
        "stability": {
            "positive_days": positive_days,
            "total_days": len(window),
            "score": round(stability_score, 4),
        },
    }


def fetch_venue(exchange, sym):
    urls = {
        "binance": f"https://fapi.binance.com/fapi/v1/fundingRate?symbol={sym}USDT&limit={LIMIT}",
        "bybit": f"{PROXY_URL}/api.bybit.com/v5/market/funding/history?category=linear&symbol={sym}USDT&limit={LIMIT}",
        "okx": f"https://www.okx.com/api/v5/public/funding-rate-history?instId={sym}-USDT-SWAP&limit={LIMIT}",
        "mexc": f"https://contract.mexc.com/api/v1/contract/funding_rate/history?symbol={sym}_USDT&page_num=1&page_size={LIMIT}",
    }
    try:
        payload = http_get_json(urls[exchange])
        return venue_block(exchange, sym, payload)
    except urllib.error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode("utf-8", "replace")[:200]
        except Exception:
            pass
        print(f"  ! {exchange}/{sym} HTTP {e.code}: {body}", file=sys.stderr)
        return None
    except (urllib.error.URLError, json.JSONDecodeError, OSError, ValueError) as e:
        print(f"  ! {exchange}/{sym} failed: {e}", file=sys.stderr)
        return None


def main():
    out_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "src", "data", "funding.json",
    )
    result = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "symbols": {},
    }
    for sym in SYMBOLS:
        print(f"{sym}:")
        venues = {}
        stability = {}
        for exchange in TAKER_FEE_BPS:
            block = fetch_venue(exchange, sym)
            if block is None:
                venues[exchange] = None
                print(f"  {exchange}: null (failed)")
            else:
                venues[exchange] = block
                stability[exchange] = block["stability"]
                print(f"  {exchange}: rate={block['rate']:.8f} apr={block['apr']:.2f}% "
                      f"net_short={block['net_apr_short']:.2f}% interval={block['interval_h']}h")
        result["symbols"][sym] = {"venues": venues, "stability": stability}

    tmp = out_path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(result, f, indent=2)
    os.replace(tmp, out_path)
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
