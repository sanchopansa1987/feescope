/// <reference types="astro/client" />

import type { AnalyticsEnv } from "./lib/analytics";
import type { SignupEnv } from "./lib/signup";

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface Env extends AnalyticsEnv, SignupEnv {}

declare global {
  namespace App {
    interface Locals extends Runtime {}
  }
}
