import type { APIRoute } from "astro";
import { logClick } from "../../lib/analytics";

// Minimal click-logging endpoint for client-side interaction events (venue
// clicks, "see full table", "get alerts", accordion expansion). Reuses the
// existing logClick measurement spine; the event name rides in the `exchange`
// blob for now (Phase 2 can widen the Analytics Engine schema).
export const POST: APIRoute = async ({ request, locals }) => {
  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const name = body.name ?? "unknown";
  logClick(locals.runtime?.env, {
    exchange: name,
    source_page: request.headers.get("referer") ?? "",
    locale: "en",
  });
  return new Response(null, { status: 204 });
};
