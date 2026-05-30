#!/usr/bin/env node
import { parseArgs } from "node:util";
import { join } from "node:path";
import { compile, BlockingAmbiguityError, DEFAULT_MODEL, type CompileResult } from "./compiler.js";
import { loadConfig, writeDefaultConfig, CONFIG_NAME, OPTION_NOTES, type Config } from "./config.js";

export function renderJson(r: CompileResult): string {
  return JSON.stringify(r.raw, null, 2);
}

export function renderHuman(r: CompileResult): string {
  const block = (title: string, obj: unknown) =>
    `## ${title}\n\n\`\`\`json\n${JSON.stringify(obj, null, 2)}\n\`\`\`\n`;
  return [
    block("1. Semantic Analysis", r.semanticAnalysis),
    block("2. Optimized Prompt IR", r.optimizedIr),
    block("3. Entropy Analysis", r.entropyAnalysis),
    `## 4. Final Optimized Execution Prompt\n\n${r.executionPrompt}\n`,
  ].join("\n");
}

const FIDELITY_THRESHOLD = 0.6;

export function warnIfLowFidelity(r: CompileResult, mode: string): void {
  if (mode === "strict" && r.fidelityScore < FIDELITY_THRESHOLD) {
    console.error(`warning: low fidelityScore=${r.fidelityScore.toFixed(2)}; ` +
      `the compiled prompt may have lost meaning.`);
    for (const item of r.droppedOrUncertain) console.error(`  dropped/uncertain: ${item}`);
  }
}

function cmdInit(): number {
  const path = join(process.cwd(), CONFIG_NAME);
  writeDefaultConfig(path);
  console.log(`wrote ${path}`);
  for (const [key, note] of Object.entries(OPTION_NOTES)) console.log(`  ${key}: ${note}`);
  return 0;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  if (argv[0] === "init") return cmdInit();
  if (argv[0] !== "compile") {
    console.error("usage: cave <compile|init> \"<prompt>\" [--json] [--model <id>] " +
      "[--lang <code>] [--mode strict|compact] [--entropy|--no-entropy] " +
      "[--verbatim-echo|--no-verbatim-echo] [--gate|--no-gate] [--gate-min-chars N]");
    return 1;
  }
  const { values, positionals } = parseArgs({
    args: argv.slice(1),
    options: {
      json: { type: "boolean", default: false },
      model: { type: "string", default: DEFAULT_MODEL },
      lang: { type: "string", default: "auto" },
      mode: { type: "string", default: "strict" },
      entropy: { type: "boolean" },
      "no-entropy": { type: "boolean" },
      "verbatim-echo": { type: "boolean" },
      "no-verbatim-echo": { type: "boolean" },
      gate: { type: "boolean" },
      "no-gate": { type: "boolean" },
      "gate-min-chars": { type: "string" },
    },
    allowPositionals: true,
  });
  const text = positionals[0] ?? (await readStdin());
  if (!text.trim()) { console.error("error: empty prompt"); return 1; }
  const mode = (values.mode as string) === "compact" ? "compact" : "strict";

  const cfg: Config = loadConfig();
  if (values.entropy) cfg.includeEntropy = true;
  if (values["no-entropy"]) cfg.includeEntropy = false;
  if (values["verbatim-echo"]) cfg.verbatimEcho = true;
  if (values["no-verbatim-echo"]) cfg.verbatimEcho = false;
  if (values.gate) cfg.gateEnabled = true;
  if (values["no-gate"]) cfg.gateEnabled = false;
  if (values["gate-min-chars"]) cfg.gateMinChars = Number(values["gate-min-chars"]);

  try {
    const r = await compile(text, { model: values.model as string, lang: values.lang as string, mode, config: cfg });
    if (!r.compiled) {
      console.error("skipped: prompt below gate threshold; passed through unchanged.");
      console.log(r.executionPrompt);
      return 0;
    }
    warnIfLowFidelity(r, mode);
    console.log(values.json ? renderJson(r) : renderHuman(r));
    return 0;
  } catch (e) {
    if (e instanceof BlockingAmbiguityError) {
      console.error("Blocking ambiguity — clarify before compiling:");
      for (const q of e.questions) console.error(`  - ${q}`);
      return 2;
    }
    throw e;
  }
}

// run when invoked as a binary
import { fileURLToPath } from "node:url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then((code) => process.exit(code));
}
