const ALLOWLIST = new Set(['fapi.binance.com', 'api.bybit.com']);

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const parts = url.pathname.slice(1).split('/');
    const host = parts.shift();
    if (!host || !ALLOWLIST.has(host)) {
      return new Response(JSON.stringify({ error: 'host not allowed' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }
    const target = `https://${host}/${parts.join('/')}${url.search}`;
    const upstream = await fetch(target, {
      headers: { 'User-Agent': 'FeeScopeFetcher/1.0' },
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { 'content-type': 'application/json' },
    });
  },
};
