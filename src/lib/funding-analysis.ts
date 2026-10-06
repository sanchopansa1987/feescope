import fundingJson from "../data/funding.json";

// Static per-venue funding feed written by scripts/fetch-funding.py.
// The page reads pre-computed values; no fee or APR math happens at render time
// except the cost projection, which lives here as a pure helper.

// Matches scripts/fetch-funding.py HOLDING_DAYS (round-trip same-day).
export const HOLDING_PERIOD_DAYS = 1;

export interface VenueStability {
  positive_days: number;
  total_days: number;
  score: number;
}

export interface VenueBlock {
  rate: number;
  interval_h: number;
  apr: number;
  net_apr_short: number;
  net_apr_long: number;
  settled_at: string;
  mark_price: number | null;
  stability: VenueStability;
}

export interface VenueAnalysis {
  key: string;
  venue: string;
  block: VenueBlock | null;
}

export interface SymbolAnalysis {
  symbol: string;
  generatedAt: string;
  avgAprPct: number | null;
  cheapest: VenueAnalysis | null;
  best: VenueAnalysis | null;
  venues: VenueAnalysis[];
  stabilityLabel: "STABLE" | "MODERATE" | "VOLATILE" | "UNKNOWN";
  stabilityPositiveDays: number | null;
  stabilityTotalDays: number | null;
  stabilityScore: number | null;
}

export type PeriodKey = "1d" | "1w" | "1m" | "3m" | "1y";

export const PERIOD_DAYS: Record<PeriodKey, number> = {
  "1d": 1,
  "1w": 7,
  "1m": 30,
  "3m": 90,
  "1y": 365,
};

export function periodDays(period: PeriodKey): number {
  return PERIOD_DAYS[period] ?? 30;
}

/** Funding cost in USD over `periodDays` for a position of `sizeUsd`.
 *  `aprPct` is the venue's annualized funding. Returns a signed number:
 *  positive = paying, negative = earning. The direction sign is applied by the
 *  caller (long pays the rate, short receives it). */
export function computeFundingCost(
  sizeUsd: number,
  aprPct: number,
  days: number,
): number {
  return sizeUsd * (aprPct / 100) * (days / 365);
}

/** Round-trip fee in USD (two sides at the venue taker rate). */
export function roundTripFeeUsd(sizeUsd: number, takerBps: number): number {
  return (sizeUsd * takerBps * 2) / 10000;
}

const VENUE_LABEL: Record<string, string> = {
  binance: "Binance",
  bybit: "Bybit",
  okx: "OKX",
  mexc: "MEXC",
};

const VENUE_TAKER_BPS: Record<string, number> = {
  binance: 4.0,
  bybit: 5.5,
  okx: 5.0,
  mexc: 6.0,
};

export function venueTakerBps(key: string): number {
  return VENUE_TAKER_BPS[key] ?? 0;
}

export function stabilityLabel(score: number | null) {
  if (score === null) return "UNKNOWN" as const;
  if (score >= 0.8) return "STABLE" as const;
  if (score >= 0.5) return "MODERATE" as const;
  return "VOLATILE" as const;
}

type FundingSymbols = Record<string, { venues: Record<string, VenueBlock | null> }>;

export function analyzeSymbol(symbol: string): SymbolAnalysis {
  const sym = symbol.toUpperCase();
  const symData = (fundingJson.symbols as FundingSymbols)[sym];

  const venues: VenueAnalysis[] = Object.entries(VENUE_LABEL).map(([key, venue]) => ({
    key,
    venue,
    block: symData?.venues?.[key] ?? null,
  }));

  const valid = venues.filter((v) => v.block !== null);
  const avgAprPct =
    valid.length > 0
      ? valid.reduce((s, v) => s + (v.block!.apr ?? 0), 0) / valid.length
      : null;

  // Cost framing: cheapest to LONG = lowest APR; best to SHORT = highest APR.
  const cheapest = valid.reduce<VenueAnalysis | null>(
    (a, v) => (a === null || v.block!.apr < a.block!.apr ? v : a),
    null,
  );
  const best = valid.reduce<VenueAnalysis | null>(
    (a, v) => (a === null || v.block!.apr > a.block!.apr ? v : a),
    null,
  );

  const stabilityScore = best?.block?.stability?.score ?? null;
  const stabilityPositiveDays = best?.block?.stability?.positive_days ?? null;
  const stabilityTotalDays = best?.block?.stability?.total_days ?? null;

  return {
    symbol: sym,
    generatedAt: (fundingJson as { generated_at?: string }).generated_at ?? "",
    avgAprPct,
    cheapest,
    best,
    venues,
    stabilityLabel: stabilityLabel(stabilityScore),
    stabilityPositiveDays,
    stabilityTotalDays,
    stabilityScore,
  };
}
