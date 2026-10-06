import { resolve } from "node:path";
import { regenerate } from "../src/lib/regenerate";

const repoRoot = resolve(import.meta.dirname, "../..");
const manifest = resolve(repoRoot, "content-site/pages-manifest.json");

const outputs = regenerate(manifest, repoRoot);
for (const out of outputs) console.log(out);
