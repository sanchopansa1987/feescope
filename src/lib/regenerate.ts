import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

export interface PageManifestEntry {
  route: string;
  data: string[];
  /** Shell command that rebuilds this page's data; run from the project root. */
  regenerate: string;
}

interface PageManifest {
  pages: PageManifestEntry[];
}

/**
 * Auto-regeneration pattern: each data-driven page declares itself in
 * pages-manifest.json; regenerate() runs its rebuild command. Adding a new data
 * page later is a manifest entry, not new code.
 */
export function regenerate(manifestPath: string, projectRoot: string): string[] {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as PageManifest;
  const outputs: string[] = [];
  for (const page of manifest.pages) {
    outputs.push(
      execSync(page.regenerate, { encoding: "utf8", cwd: projectRoot }).trim(),
    );
  }
  return outputs;
}
