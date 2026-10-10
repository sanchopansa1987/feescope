/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals extends import("@astrojs/cloudflare").Runtime<Env> {}
}
