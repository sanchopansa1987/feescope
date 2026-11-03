import type { APIRoute } from "astro";

/**
 * Live cross-venue perpetual funding rates.
 *
 * Why this file and not a static JSON: the `feescope` Pages project builds from
 * this repo (`npm run build` -> `dist`), so anything uploaded outside git is
 * overwritten by the next build. A route committed here is production forever,
 * needs no cron, and cannot be clobbered by a deploy from another machine.
 *
 * Public endpoints only — no keys, no accounts, no orders.
 */

const SYMBOLS = ["BTC", "ETH", "SOL"] as const;

const URLS: Record<string, (base: string) => string> = {
  bybit: (b) => `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${b}USDT`,
  mexc: (b) => `https://contract.mexc.com/api/v1/contract/funding_rate/${b}_USDT`,
  okx: (b) => `https://www.okx.com/api/v5/public/funding-rate?instId=${b}-USDT-SWAP`,
};

type Raw = { rate: number; intervalHours: number; nextFundingMs: number };

/* Each venue publishes a different shape; these three parsers are the whole
 * normaliser. Measured against live payloads (2026-11-03):
 *   bybit result.list[0].fundingRate | .fundingIntervalHour | .nextFundingTime
 *   mexc  data.fundingRate          | .collectCycle        | .nextSettleTime
 *   okx   data[0].fundingRate       | (8h for USDT swaps)  | .nextFundingTime
 */
const PARSERS: Record<string, (d: any) => Raw> = {
  bybit: (d) => {
    const r = d.result.list[0];
    return {
      rate: Number(r.fundingRate),
      intervalHours: Number(r.fundingIntervalHour ?? 8),
      nextFundingMs: Number(r.nextFundingTime),
    };
  },
  mexc: (d) => {
    const r = d.data;
    return {
      rate: Number(r.fundingRate),
      intervalHours: Number(r.collectCycle ?? 8),
      nextFundingMs: Number(r.nextSettleTime),
    };
  },
  okx: (d) => {
    const r = d.data[0];
    return {
      rate: Number(r.fundingRate),
      intervalHours: 8,
      nextFundingMs: Number(r.nextFundingTime),
    };
  },
};

async function json(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    // Upstream updates every 8h at most; 60s of edge cache is plenty and keeps
    // three venues x N symbols well inside every public rate limit.
    cf: { cacheTtl: 60, cacheEverything: true },
  } as RequestInit);
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return res.json();
}

/** Funding per interval annualised: intervals/day x 365. */
function aprPct(rate: number, intervalHours: number): number {
  return Number(((rate * (24 / intervalHours) * 365) * 100).toFixed(2));
}

export const GET: APIRoute = async () => {
  const errors: Array<{ venue: string; symbol: string; error: string }> = [];
  const body: any = {
    generatedAt: new Date().toISOString(),
    unit: "rate = funding per interval; aprPct annualised; spread = max-min APR across venues",
    symbols: {},
    errors,
  };

  await Promise.all(
    SYMBOLS.map(async (base) => {
      const venues: Record<string, any> = {};
      await Promise.all(
        Object.entries(URLS).map(async ([venue, url]) => {
          try {
            const raw = PARSERS[venue](await json(url(base)));
            if (!Number.isFinite(raw.rate)) throw new Error("unparseable rate");
            venues[venue] = {
              rate: raw.rate,
              intervalHours: raw.intervalHours,
              aprPct: aprPct(raw.rate, raw.intervalHours),
              nextFunding: new Date(raw.nextFundingMs).toISOString().slice(0, 16) + "Z",
            };
          } catch (err) {
            // One dead venue must not blank the feed: the other rows are still
            // true, and the error is published rather than swallowed.
            errors.push({ venue, symbol: base, error: String(err).slice(0, 160) });
          }
        }),
      );
      const rows = Object.entries(venues);
      if (rows.length >= 2) {
        const sorted = [...rows].sort((a, b) => a[1].aprPct - b[1].aprPct);
        const [lowVenue, low] = sorted[0];
        const [highVenue, high] = sorted[sorted.length - 1];
        body.symbols[base] = {
          venues,
          spread: {
            aprPct: Number((high.aprPct - low.aprPct).toFixed(2)),
            receiveOn: highVenue, // paid to shorts: the high-APR venue
            payOn: lowVenue,
          },
        };
      } else {
        body.symbols[base] = { venues };
      }
    }),
  );

  return new Response(JSON.stringify(body, null, 1), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      // 5 minutes: fresh enough for a funding table, cheap enough for any spike.
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
};
