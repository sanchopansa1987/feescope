// Measurement spine, Phase 2: Cloudflare Analytics Engine.
//
// On the edge (deployed), `env.ANALYTICS` is the Analytics Engine dataset
// binding and writeDataPoint(...) records the event. In `astro dev` there is no
// binding, so we fall back to console.log. The Phase 1 JSONL writer is
// deliberately removed — workerd has no filesystem, so a JSONL append cannot
// run at the edge.

export interface AnalyticsDataset {
  writeDataPoint(point: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

export interface AnalyticsEnv {
  ANALYTICS?: AnalyticsDataset;
}

function write(
  env: AnalyticsEnv | undefined,
  blobs: string[],
  indexes: string[],
): void {
  const dataset = env?.ANALYTICS;
  // In `astro dev` there is no edge binding — log to console so the event is
  // observable (the adapter may still inject a mock binding, hence the DEV
  // guard). On the edge, write the data point.
  if (dataset && import.meta.env.DEV !== true) {
    dataset.writeDataPoint({ blobs, doubles: [1], indexes });
  } else {
    console.log("[analytics:dev]", JSON.stringify({ blobs, at: new Date().toISOString() }));
  }
}

export interface PageviewInput {
  path: string;
  locale: string;
  referrer: string;
}

export function logPageview(
  env: AnalyticsEnv | undefined,
  { path, locale, referrer }: PageviewInput,
): void {
  write(env, ["pageview", path, locale, referrer], [path]);
}

export interface ClickInput {
  exchange: string;
  source_page: string;
  locale: string;
}

export function logClick(
  env: AnalyticsEnv | undefined,
  { exchange, source_page, locale }: ClickInput,
): void {
  write(env, ["click", exchange, source_page, locale], [exchange]);
}
