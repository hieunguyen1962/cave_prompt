import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const CONFIG_NAME = "cave.config.json";

export interface Config {
  includeEntropy: boolean;   // B2
  verbatimEcho: boolean;     // B3
  gateEnabled: boolean;      // C3
  gateMinChars: number;
}

export const DEFAULT_CONFIG: Config = {
  includeEntropy: false, verbatimEcho: false, gateEnabled: true, gateMinChars: 280,
};

export const OPTION_NOTES: Record<string, string> = {
  include_entropy: "OFF saves output tokens; ON shows the redundancy/density breakdown.",
  verbatim_echo: "OFF saves output tokens (spans stay inside execution_prompt); " +
                 "ON also lists them for machine validation.",
  gate_enabled: "ON skips compiling trivial prompts (no LLM call); OFF always compiles.",
};

// config file uses snake_case keys (shared with the Python package)
function fromFile(raw: any): Config {
  return {
    includeEntropy: raw.include_entropy ?? DEFAULT_CONFIG.includeEntropy,
    verbatimEcho: raw.verbatim_echo ?? DEFAULT_CONFIG.verbatimEcho,
    gateEnabled: raw.gate_enabled ?? DEFAULT_CONFIG.gateEnabled,
    gateMinChars: raw.gate_min_chars ?? DEFAULT_CONFIG.gateMinChars,
  };
}

export function loadConfig(): Config {
  for (const base of [process.cwd(), homedir()]) {
    const f = join(base, CONFIG_NAME);
    if (existsSync(f)) return fromFile(JSON.parse(readFileSync(f, "utf-8")));
  }
  return { ...DEFAULT_CONFIG };
}

export function writeDefaultConfig(path: string): Config {
  const snake = {
    include_entropy: DEFAULT_CONFIG.includeEntropy,
    verbatim_echo: DEFAULT_CONFIG.verbatimEcho,
    gate_enabled: DEFAULT_CONFIG.gateEnabled,
    gate_min_chars: DEFAULT_CONFIG.gateMinChars,
  };
  writeFileSync(path, JSON.stringify(snake, null, 2) + "\n", "utf-8");
  return { ...DEFAULT_CONFIG };
}
