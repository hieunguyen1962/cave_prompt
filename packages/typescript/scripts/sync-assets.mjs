import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");        // cave_prompt/
const assets = join(here, "..", "assets");
mkdirSync(assets, { recursive: true });

const files = [
  join(root, "prompt", "cave_prompt.md"),
  join(root, "schema", "semantic-analysis.schema.json"),
  join(root, "schema", "optimized-ir.schema.json"),
];
for (const f of files) {
  copyFileSync(f, join(assets, basename(f)));
  console.log(`synced ${basename(f)}`);
}
