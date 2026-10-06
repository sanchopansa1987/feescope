#!/usr/bin/env python3
"""Export frozen funding data to a JSON snapshot for the content site.

The frozen funding data is pandas pickle (not readable by Node/Astro), so this
script bridges it: it reads the frozen manifest + per-symbol pickles and writes a
typed JSON snapshot that the Astro data layer imports. Re-run after a re-freeze.

Reads (read-only): backtest/cache/frozen/2026-10-05-funding/
Writes:            content-site/src/data/funding-snapshot.json
"""
import json
from pathlib import Path

import pandas as pd

FROZEN = Path("backtest/cache/frozen/2026-10-05-funding")
OUT = Path("content-site/src/data/funding-snapshot.json")

MS_PER_DAY = 24 * 3600 * 1000
MS_PER_YEAR = 365 * MS_PER_DAY


def main() -> None:
    manifest = json.loads((FROZEN / "manifest.json").read_text())
    rows = []
    for rec in manifest["datasets"]:
        if rec.get("status") != "complete":
            continue
        df = pd.read_pickle(FROZEN / rec["file"])
        rates = df["funding_rate"].to_numpy(dtype=float)
        ts = df["timestamp"].to_numpy(dtype="int64")

        cadence_ms = int(pd.Series(ts).diff().median())
        intervals_per_year = MS_PER_YEAR / cadence_ms
        n_7d = int(round(7 * MS_PER_DAY / cadence_ms))
        n_30d = int(round(30 * MS_PER_DAY / cadence_ms))

        latest = float(rates[-1])
        rows.append(
            {
                "symbol": rec["symbol"],
                "cadenceHours": round(cadence_ms / 3600000),
                "latestRatePct": round(latest * 100, 4),
                "annualizedAprPct": round(latest * intervals_per_year * 100, 2),
                "mean7dPct": round(float(rates[-n_7d:].mean()) * 100, 4),
                "mean30dPct": round(float(rates[-n_30d:].mean()) * 100, 4),
                "lastUpdatedMs": int(ts[-1]),
            }
        )

    rows.sort(key=lambda r: -r["annualizedAprPct"])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "source": str(FROZEN),
                "generatedAtMs": int(pd.Timestamp.now().timestamp() * 1000),
                "rows": rows,
            },
            indent=2,
        )
    )
    print(f"wrote {OUT} ({len(rows)} symbols)")


if __name__ == "__main__":
    main()
