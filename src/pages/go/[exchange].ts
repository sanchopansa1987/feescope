import type { APIRoute } from "astro";
import { getAffiliateUrl } from "../../../config/affiliates";
import { logClick } from "../../lib/analytics";

// Venue homepages for exchanges without an affiliate link yet. Used as the
// fallback so a click never bounces back to the site's own homepage.
const HOMEPAGES: Record<string, string> = {
  okx: "https://www.okx.com/",
  mexc: "https://www.mexc.com/",
  hyperliquid: "https://app.hyperliquid.xyz/",
  gateio: "https://www.gate.io/",
  bitget: "https://www.bitget.com/",
  bybit: "https://www.bybit.com/",
  binance: "https://www.binance.com/",
};

// /go/[exchange] — logs the click, then redirects. Affiliate URL when set,
// otherwise the venue homepage, otherwise "/".
export const GET: APIRoute = ({ params, request, locals }) => {
  const exchange = (params.exchange ?? "").toLowerCase();
  const target = getAffiliateUrl(exchange);
  const dest = target !== "#" ? target : HOMEPAGES[exchange] ?? "/";
  logClick(locals.runtime?.env, {
    exchange,
    source_page: request.headers.get("referer") ?? "",
    locale: "en",
  });
  return new Response(null, { status: 302, headers: { Location: dest } });
};
