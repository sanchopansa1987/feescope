// Affiliate referral targets. Phase 1: all placeholders ("#"). Phase 2 replaces
// these with real referral URLs and adds an FTC disclosure on the /go page.
const AFFILIATE_URLS: Record<string, string> = {
  bybit: "#",
  okx: "#",
  binance: "#",
  mexc: "#",
};

export function getAffiliateUrl(exchange: string): string {
  return AFFILIATE_URLS[exchange.toLowerCase()] ?? "#";
}
