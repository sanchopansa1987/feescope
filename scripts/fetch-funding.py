#!/usr/bin/env python3
"""Fetch per-venue funding rates from 5 exchanges and write funding.json.

Static pipeline: run on schedule (see .github/workflows/fetch-funding.yml),
commit the JSON, and let Cloudflare Pages rebuild. No runtime API calls.

Normalization:
  - apr = ((1 + rate) ** ((24 / interval_h) * 365) - 1) * 100
  - net_apr_short = apr - (taker_bps * 2 * (365 / holding_days) / 100)
  - net_apr_long  = -(apr + taker_bps * 2 * (365 / holding_days) / 100)
  - stability.score = same-sign settlements among last N / N

Venues: OKX, MEXC, Hyperliquid, Gate.io, Bitget. Binance and Bybit were removed
because their public APIs geo-block cloud infrastructure. Bitfinex was considered
but skipped (FRR vs CURRENT_FUNDING ambiguity).

Per-venue errors are tolerated: a failed venue is written as null and the run
continues.
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

# VIP-0 futures taker fee per side, in basis points. Single source of truth is
# src/data/fees.ts — keep these in sync.
TAKER_FEE_BPS = {
    "okx": 5.0,
    "mexc": 6.0,
    "hyperliquid": 3.5,
    "gateio": 5.0,
    "bitget": 6.0,
}

UA = {"User-Agent": "FeeScope/1.0 (+https://feescope.pages.dev)"}


def http_get_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def http_post_json(url, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        url, data=data, headers={**UA, "Content-Type": "application/json"}
    )
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
        if exchange == "hyperliquid":
            for r in payload:
                entries.append((int(r["time"]), float(r["fundingRate"]), None))
            interval_h = interval_hours_from_timestamps([e[0] for e in entries])
        elif exchange == "gateio":
            for r in payload:
                entries.append((int(r["t"]) * 1000, float(r["r"]), None))
            interval_h = interval_hours_from_timestamps([e[0] for e in entries])
        elif exchange == "bitget":
            for r in payload.get("data", {}).get("resultList", []):
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
    # Hyperliquid is a POST endpoint (no URL path).
    if exchange == "hyperliquid":
        try:
            start_ms = int((time.time() - 30 * 86400) * 1000)
            payload = http_post_json(
                "https://api.hyperliquid.xyz/info",
                {"type": "fundingHistory", "coin": sym, "startTime": start_ms},
            )
            return venue_block(exchange, sym, payload)
        except urllib.error.HTTPError as e:
            print(f"  ! {exchange}/{sym} HTTP {e.code}", file=sys.stderr)
            return None
        except (urllib.error.URLError, json.JSONDecodeError, OSError, ValueError) as e:
            print(f"  ! {exchange}/{sym} failed: {e}", file=sys.stderr)
            return None

    urls = {
        "okx": f"https://www.okx.com/api/v5/public/funding-rate-history?instId={sym}-USDT-SWAP&limit={LIMIT}",
        "mexc": f"https://contract.mexc.com/api/v1/contract/funding_rate/history?symbol={sym}_USDT&page_num=1&page_size={LIMIT}",
        "gateio": f"https://api.gateio.ws/api/v4/futures/usdt/funding_rate?contract={sym}_USDT&limit={LIMIT}",
        "bitget": f"https://api.bitget.com/api/v3/market/history-fund-rate?symbol={sym}USDT&category=USDT-FUTURES&pageSize={LIMIT}",
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
