import type { APIRoute } from "astro";
import { getAffiliateUrl } from "../../../config/affiliates";
import { logClick } from "../../lib/analytics";

// /go/[exchange] — logs the click, then redirects. Unknown exchanges (or the
// "#" placeholder) fall back to "/".
export const GET: APIRoute = ({ params, request, locals }) => {
  const exchange = (params.exchange ?? "").toLowerCase();
  const target = getAffiliateUrl(exchange);
  const dest = target === "#" ? "/" : target;
  logClick(locals.runtime?.env, {
    exchange,
    source_page: request.headers.get("referer") ?? "",
    locale: "en",
  });
  return new Response(null, { status: 302, headers: { Location: dest } });
};
