import { describe, it, expect } from "vitest";
import { compile, BlockingAmbiguityError } from "../src/compiler.js";
import type { Config } from "../src/config.js";

// Disable the gate + request all sections so the LLM path runs deterministically.
const NOGATE: Config = { gateEnabled: false, includeEntropy: true, verbatimEcho: true, gateMinChars: 280 };

const ENVELOPE = {
  blocking_ambiguities: [],
  semantic_analysis: { intent: "x", domain: "d", entities: [], constraints: {},
    priorities: [], response_preferences: {}, ambiguities: [], hidden_requirements: [] },
  optimized_ir: { task_type: "t", execution_requirements: [], context_priority: {},
    reasoning_mode: "r", tool_requirements: [] },
  entropy_analysis: { semantic_density: 0.8, redundant_spans: [], low_information_spans: [],
    execution_critical_spans: [], summary: "ok" },
  verbatim_spans: ["100k", "Redis"],
  fidelity_score: 0.92,
  dropped_or_uncertain: [],
  execution_prompt: "Do X concisely.",
};

function fakeClient(payload: object) {
  return { messages: { create: async (kwargs: any) => {
    (fakeClient as any).last = kwargs;
    return { content: [{ type: "text", text: JSON.stringify(payload) }] };
  } } };
}

describe("compile", () => {
  it("parses and validates", async () => {
    const r = await compile("build me a thing", { config: NOGATE, client: fakeClient(ENVELOPE) as any });
    expect(r.compiled).toBe(true);
    expect(r.executionPrompt).toBe("Do X concisely.");
    expect(r.semanticAnalysis.intent).toBe("x");
  });
  it("exposes fidelity fields", async () => {
    const r = await compile("x", { config: NOGATE, client: fakeClient(ENVELOPE) as any });
    expect(r.fidelityScore).toBe(0.92);
    expect(r.verbatimSpans).toEqual(["100k", "Redis"]);
    expect(r.droppedOrUncertain).toEqual([]);
  });
  it("injects mode into the prompt", async () => {
    await compile("hi", { mode: "compact", config: NOGATE, client: fakeClient(ENVELOPE) as any });
    expect((fakeClient as any).last.messages[0].content).toContain("fidelity_mode=compact");
  });
  it("omits sections from the instruction when options are off", async () => {
    const cfg: Config = { gateEnabled: false, includeEntropy: false, verbatimEcho: false, gateMinChars: 280 };
    await compile("a fairly long prompt that exceeds the gate threshold ".repeat(6),
      { config: cfg, client: fakeClient(ENVELOPE) as any });
    const content = (fakeClient as any).last.messages[0].content;
    expect(content).not.toContain("entropy_analysis");
    expect(content).not.toContain("verbatim_spans");
  });
  it("gate skips a simple prompt without calling the LLM", async () => {
    const throwing = { messages: { create: async () => { throw new Error("should not be called"); } } };
    const r = await compile("hi there", { config: { ...NOGATE, gateEnabled: true }, client: throwing as any });
    expect(r.compiled).toBe(false);
    expect(r.executionPrompt).toBe("hi there");
  });
  it("sends a cached system block", async () => {
    await compile("hi", { config: NOGATE, client: fakeClient(ENVELOPE) as any });
    expect((fakeClient as any).last.system[0].cache_control).toEqual({ type: "ephemeral" });
  });
  it("throws on blocking ambiguity", async () => {
    const env = { ...ENVELOPE, blocking_ambiguities: ["Which platform?"] };
    await expect(compile("vague", { config: NOGATE, client: fakeClient(env) as any }))
      .rejects.toBeInstanceOf(BlockingAmbiguityError);
  });
  it("throws on invalid schema", async () => {
    const bad = { ...ENVELOPE, semantic_analysis: { intent: "" } };
    await expect(compile("x", { config: NOGATE, client: fakeClient(bad) as any })).rejects.toThrow();
  });
});
