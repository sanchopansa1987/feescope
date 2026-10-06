export interface ExchangeFees {
  name: string;
  /** Taker fee per side, in basis points (1 bp = 0.01%). */
  takerBps: number;
  /** Maker fee per side, in basis points. */
  makerBps: number;
}

// VIP-0 futures fee baseline, per side. Phase 1 constants — re-verify against
// each exchange's current fee table before Phase 2 goes live. Do not hardcode
// these anywhere else; components read from here.
export const exchanges: ExchangeFees[] = [
  { name: "Binance", takerBps: 4.0, makerBps: 2.0 },
  { name: "OKX", takerBps: 5.0, makerBps: 2.0 },
  { name: "Bybit", takerBps: 5.5, makerBps: 2.0 },
  { name: "MEXC", takerBps: 6.0, makerBps: 1.0 },
];

/** Blended per-side fee rate (fraction) for a maker:taker split. */
export function blendedFeeRate(fees: ExchangeFees, makerRatio: number): number {
  const takerRatio = Math.max(0, Math.min(1, 1 - makerRatio));
  const maker = Math.max(0, Math.min(1, makerRatio));
  return (maker * fees.makerBps + takerRatio * fees.takerBps) / 10000;
}

/** Monthly fee cost in USD for a given monthly notional volume. */
export function monthlyFeeUsd(
  fees: ExchangeFees,
  monthlyVolumeUsd: number,
  makerRatio: number,
): number {
  return monthlyVolumeUsd * blendedFeeRate(fees, makerRatio);
}
