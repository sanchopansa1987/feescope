export interface FundingRow {
  symbol: string;
  cadenceHours: number;
  latestRatePct: number;
  annualizedAprPct: number;
  mean7dPct: number;
  mean30dPct: number;
  lastUpdatedMs: number;
}

interface Snapshot {
  source: string;
  generatedAtMs: number;
  rows: FundingRow[];
}

// The frozen funding data is pandas pickle, which Node/Astro cannot read.
// scripts/export-funding.py bridges it into this JSON snapshot; this module is
// the single typed access point for the site.
import snapshotRaw from "./funding-snapshot.json";

const snapshot = snapshotRaw as unknown as Snapshot;

export const generatedAtMs: number = snapshot.generatedAtMs;
export const fundingRows: FundingRow[] = snapshot.rows;
