import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");          // cave_prompt/
const assets = join(here, "..", "assets");
const names = ["prompt/cave_prompt.md", "schema/semantic-analysis.schema.json", "schema/optimized-ir.schema.json"];

describe("assets in sync", () => {
  it("bundled assets match root", () => {
    for (const rel of names) {
      const base = rel.split("/").pop()!;
      expect(readFileSync(join(assets, base), "utf-8"))
        .toBe(readFileSync(join(root, rel), "utf-8"));
    }
  });
});
