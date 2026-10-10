import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Server-rendered on Cloudflare Pages (Functions). The analytics binding is
// wired in wrangler.toml; in `astro dev` (no binding) the writer falls back to
// console logging.
//
// `site` is the single source of truth for absolute URLs (sitemap + canonical).
// Update it when a custom domain is registered.
export default defineConfig({
  site: "https://feescope.io",
  output: "server",
  adapter: cloudflare(),
  integrations: [
    sitemap({
      // Dynamic /funding/[symbol] routes are on-demand (no getStaticPaths), so
      // enumerate the tracked symbols explicitly for the sitemap.
      customPages: ["ETH", "BTC", "SOL", "XRP", "DOT"].map(
        (sym) => `https://feescope.io/funding/${sym}`,
      ),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
