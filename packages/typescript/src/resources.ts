import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// dist/resources.js → ../assets ; src/resources.ts (vitest) → ../assets
const assets = join(here, "..", "assets");

let _sys: string | null = null;
export function systemPrompt(): string {
  if (_sys === null) _sys = readFileSync(join(assets, "cave_prompt.md"), "utf-8");
  return _sys;
}

const _cache = new Map<string, any>();
export function schema(name: string): any {
  if (!_cache.has(name))
    _cache.set(name, JSON.parse(readFileSync(join(assets, `${name}.schema.json`), "utf-8")));
  return _cache.get(name);
}
