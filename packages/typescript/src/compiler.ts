// eslint-disable-next-line @typescript-eslint/no-require-imports
const Ajv = require("ajv");
import { systemPrompt, schema } from "./resources.js";
import { type Config, loadConfig } from "./config.js";

export const DEFAULT_MODEL = "claude-opus-4-8";
const MAX_TOKENS = 4096;

function envelopeInstruction(includeEntropy: boolean, verbatimEcho: boolean): string {
  const keys = ["blocking_ambiguities (array of strings)", "semantic_analysis", "optimized_ir"];
  if (includeEntropy) keys.push("entropy_analysis");
  if (verbatimEcho) keys.push("verbatim_spans (array of strings copied unchanged from the input: " +
    "code, numbers, names, quoted text, few-shot examples, data)");
  keys.push("fidelity_score (0-1)", "dropped_or_uncertain (array of strings)", "execution_prompt");
  let rule = "Preserve all literal spans (code, numbers, names, quoted text, few-shot examples, " +
    "data) unchanged inside execution_prompt";
  if (verbatimEcho) rule += " and also list them in verbatim_spans";
  return "Return ONLY a single JSON object (no prose, no code fences) with keys: " +
    keys.join(", ") + ". " + rule + "; compress only redundant/low-information spans. " +
    "If there are blocking ambiguities that prevent a correct compile, put the clarifying " +
    "questions in blocking_ambiguities and leave execution_prompt empty.";
}

export class BlockingAmbiguityError extends Error {
  questions: string[];
  constructor(questions: string[]) {
    super("Blocking ambiguity: " + questions.join("; "));
    this.questions = questions;
    this.name = "BlockingAmbiguityError";
  }
}

export interface CompileResult {
  semanticAnalysis: any;
  optimizedIr: any;
  entropyAnalysis: any;
  executionPrompt: string;
  verbatimSpans: string[];
  fidelityScore: number;
  droppedOrUncertain: string[];
  compiled: boolean;
  raw: any;
}

export interface CompileOptions {
  model?: string;
  lang?: string;
  mode?: "strict" | "compact";
  config?: Config;
  client?: { messages: { create: (kwargs: any) => Promise<{ content: any[] }> } };
}

function extractJson(text: string): any {
  const t = text.trim();
  try { return JSON.parse(t); }
  catch {
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Model did not return JSON");
    return JSON.parse(m[0]);
  }
}

function isSimple(prompt: string, minChars: number): boolean {
  const p = prompt.trim();
  return p.length < minChars && !p.includes("```") && (p.match(/\n/g)?.length ?? 0) < 3;
}

function passthrough(prompt: string): CompileResult {
  const p = prompt.trim();
  return {
    semanticAnalysis: {}, optimizedIr: {}, entropyAnalysis: {}, executionPrompt: p,
    verbatimSpans: [], fidelityScore: 1.0, droppedOrUncertain: [], compiled: false,
    raw: { compiled: false, execution_prompt: p },
  };
}

const ajv = new Ajv({ allErrors: true, strict: false }) as any;
const _validators = new Map<string, any>();

export async function compile(prompt: string, opts: CompileOptions = {}): Promise<CompileResult> {
  const cfg = opts.config ?? loadConfig();
  const model = opts.model ?? DEFAULT_MODEL;
  const lang = opts.lang ?? "auto";
  const mode = opts.mode ?? "strict";

  if (cfg.gateEnabled && isSimple(prompt, cfg.gateMinChars)) return passthrough(prompt);

  let client = opts.client;
  if (!client) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    client = new Anthropic() as any;
  }

  const directives = [`fidelity_mode=${mode}`];
  if (lang !== "auto") directives.push(`output_language=${lang}`);
  const instruction = envelopeInstruction(cfg.includeEntropy, cfg.verbatimEcho);
  const user = `[${directives.join(", ")}]\n${prompt}\n\n---\n${instruction}`;

  const msg = await client!.messages.create({
    model,
    max_tokens: MAX_TOKENS,
    system: [{ type: "text", text: systemPrompt(), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });
  const text = msg.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  const env = extractJson(text);

  if (env.blocking_ambiguities?.length) throw new BlockingAmbiguityError(env.blocking_ambiguities);

  for (const [name, data] of [["semantic-analysis", env.semantic_analysis],
                              ["optimized-ir", env.optimized_ir]] as const) {
    if (!_validators.has(name)) {
      // Strip $schema/$id so AJV doesn't try to resolve draft 2020-12 meta-schema or deduplicate by id
      const { $schema: _s, $id: _i, ...schemaDef } = schema(name);
      _validators.set(name, ajv.compile(schemaDef));
    }
    const validate = _validators.get(name);
    if (!validate(data)) throw new Error(`${name} failed schema: ${ajv.errorsText(validate.errors)}`);
  }

  return {
    semanticAnalysis: env.semantic_analysis,
    optimizedIr: env.optimized_ir,
    entropyAnalysis: env.entropy_analysis ?? {},
    executionPrompt: env.execution_prompt ?? "",
    verbatimSpans: env.verbatim_spans ?? [],
    fidelityScore: typeof env.fidelity_score === "number" ? env.fidelity_score : 1.0,
    droppedOrUncertain: env.dropped_or_uncertain ?? [],
    compiled: true,
    raw: env,
  };
}
