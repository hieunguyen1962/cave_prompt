import { describe, it, expect, vi } from "vitest";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderHuman, renderJson, warnIfLowFidelity, main } from "../src/cli.js";

const makeR = (fidelity = 0.9) => ({
  semanticAnalysis: { intent: "x" }, optimizedIr: { task_type: "t" },
  entropyAnalysis: { summary: "ok" }, executionPrompt: "Do X.",
  verbatimSpans: ["Redis"], fidelityScore: fidelity, droppedOrUncertain: [], compiled: true,
  raw: { execution_prompt: "Do X." },
});

describe("cli render", () => {
  it("human output has four sections", () => {
    const out = renderHuman(makeR() as any);
    expect(out).toContain("Semantic Analysis");
    expect(out).toContain("Optimized Prompt IR");
    expect(out).toContain("Entropy Analysis");
    expect(out).toContain("Final Optimized Execution Prompt");
    expect(out).toContain("Do X.");
  });
  it("json output is the envelope", () => {
    expect(JSON.parse(renderJson(makeR() as any)).execution_prompt).toBe("Do X.");
  });
  it("warns on low fidelity in strict mode", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnIfLowFidelity(makeR(0.4) as any, "strict");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
  it("stays silent on low fidelity in compact mode", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnIfLowFidelity(makeR(0.4) as any, "compact");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("cli main", () => {
  it("gate skips a simple prompt without calling the LLM", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const code = await main(["compile", "hi there"]);
    expect(code).toBe(0);
    expect(log).toHaveBeenCalledWith("hi there");
    log.mockRestore(); err.mockRestore();
  });
  it("init writes a config file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "cave-"));
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      expect(await main(["init"])).toBe(0);
      expect(existsSync(join(dir, "cave.config.json"))).toBe(true);
    } finally { process.chdir(cwd); }
  });
});
