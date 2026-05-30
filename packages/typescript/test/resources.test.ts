import { describe, it, expect } from "vitest";
import { systemPrompt, schema } from "../src/resources.js";

describe("resources", () => {
  it("loads non-empty system prompt", () => {
    expect(systemPrompt()).toContain("Cave Prompt");
    expect(systemPrompt().length).toBeGreaterThan(500);
  });
  it("loads schemas", () => {
    expect(schema("semantic-analysis").title).toContain("Cave Prompt");
    expect(schema("optimized-ir").properties.task_type).toBeTruthy();
  });
});
