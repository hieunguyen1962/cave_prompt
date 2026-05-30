# Cave Prompt

**[Tiếng Việt](README.vi.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue)](packages/python)
[![Node](https://img.shields.io/badge/node-18%2B-green)](packages/typescript)
[![CI](https://github.com/hieudeptrai196/cave_prompt/actions/workflows/ci.yml/badge.svg)](https://github.com/hieudeptrai196/cave_prompt/actions/workflows/ci.yml)

> A semantic prompt compiler / IR layer — not a chatbot.

---

## Raw prompt vs Cave Prompt

Most LLM pipelines send the user's raw text directly to the model. The model silently does its own interpretation — and you never see what it understood, whether it missed a constraint, or why two similar inputs produced different outputs.

Cave Prompt makes that interpretation step **explicit and machine-readable**.

```
# Without Cave Prompt
User input ─────────────────────────────────► LLM ──► Answer
                  (intent extracted silently)

# With Cave Prompt
User input ──► [Cave Prompt] ──► IR + Execution Prompt ──► LLM ──► Answer
                  ↓
       semantic_analysis  (what did it understand?)
       optimized_ir       (what should the LLM do?)
       fidelity_score     (how much meaning was preserved?)
       verbatim_spans     (what must never be paraphrased?)
```

| | Raw prompt | Cave Prompt |
|---|:---:|:---:|
| Intent explicitly extracted | ✗ | ✅ |
| Hidden constraints surfaced | ✗ | ✅ |
| Consistent output across rephrasings | ✗ | ✅ |
| Machine-readable IR for routing / logging | ✗ | ✅ |
| Ambiguity caught before execution | ✗ | ✅ |
| Code / numbers / names verbatim-protected | ✗ | ✅ |
| Works with any downstream model | ✅ | ✅ |
| Caching & reuse across similar requests | ✗ | ✅ |
| Prompt caching (system prompt cached across calls) | ✗ | ✅ |
| Normalized IR reduces cache misses | ✗ | ✅ |

> **When it pays off most:** pipelines, batch jobs, multi-agent systems, repeated request types, weaker downstream models.  
> **When to skip it:** one-off queries to a strong frontier model, realtime chat where latency matters.
>
> **On caching:** Cave Prompt sends its core spec as a cached system prompt (Anthropic prompt caching, 5-min TTL). The normalized execution prompt it produces is stable across rephrasings — meaning the same intent hits the downstream model's cache even when the user's wording changes. In batch or pipeline scenarios this compounds: fewer cache misses, lower token cost, faster p50 latency.

```
User Input → [Cave Prompt] → Optimized Execution Prompt → Main LLM
```

---

## What is Cave Prompt?

Cave Prompt sits between your raw input and the main LLM. It **does not answer your question** — it compiles your prompt into a semantically dense, structured execution prompt plus a machine-readable Intermediate Representation (IR).

Think of it like a compiler front-end: it parses intent, extracts constraints, reduces entropy, and hands off an optimized prompt to whatever model runs it.

**Why this matters:**

| Problem with raw prompts | Cave Prompt solution |
|---|---|
| Model misses hidden constraints | Explicit `semantic_analysis` extracts them |
| Same intent → inconsistent outputs | Normalization collapses variants to one IR |
| No visibility into what the model understood | Machine-readable IR you can log, route, validate |
| Verbose prompts waste attention budget | Entropy reduction keeps only signal |

**Value scales with usage:** Cave Prompt pays off for pipelines, batch processing, multi-agent systems, and repeated request types. For one-off prompts to a frontier model, the complexity gate (`gate_enabled=true`) automatically skips compilation.

---

## Quickstart

### Option A — Plain prompt (any LLM, no install)

Copy [`prompt/cave_prompt.md`](prompt/cave_prompt.md) into your system prompt in ChatGPT, Claude.ai, Gemini, or any API call. Then send your request as the user message.

For space-constrained fields (e.g. custom instructions), use [`prompt/cave_prompt.min.md`](prompt/cave_prompt.min.md) (~2.8 KB).

### Option B — Python CLI/SDK

**Requirements:** Python 3.10+, `ANTHROPIC_API_KEY` set in your environment.

```bash
# Install from GitHub (available now)
pip install "git+https://github.com/hieudeptrai196/cave_prompt.git#subdirectory=packages/python"

# Install from PyPI (coming soon — once published)
pip install cave-prompt
# or, for isolated install (recommended):
pipx install cave-prompt

# Compile a prompt
cave compile "Build a NestJS chatbot for 100k concurrent users, Redis session cache, stream tokens, cheap infra"

# Pipe from stdin
echo "your prompt here" | cave compile

# Machine-readable JSON output only
cave compile "your prompt" --json

# Compact mode (heavier compression, accepts more loss)
cave compile "your prompt" --mode compact

# Generate a cave.config.json with token-economy options
cave init
```

**SDK usage:**

```python
from cave_prompt import compile

result = compile("Build a NestJS chatbot for 100k users, Redis, stream tokens")
print(result.execution_prompt)
print(result.fidelity_score)
print(result.semantic_analysis)
```

### Option C — TypeScript/Node CLI/SDK

**Requirements:** Node.js 18+, `ANTHROPIC_API_KEY` set in your environment.

```bash
# Install from npm (coming soon — once published)
npm install -g cave-prompt

# Or run without installing (coming soon)
npx cave-prompt compile "your prompt here"

# Compile a prompt
cave compile "Build a NestJS chatbot for 100k concurrent users, Redis session cache, stream tokens"

# JSON output only
cave compile "your prompt" --json

# Generate cave.config.json
cave init
```

**SDK usage:**

```typescript
import { compile } from "cave-prompt";

const result = await compile("Build a NestJS chatbot for 100k users, Redis, stream tokens");
console.log(result.executionPrompt);
console.log(result.fidelityScore);
console.log(result.semanticAnalysis);
```

### Option D — Claude Code skill

Copy the [`skills/cave_prompt/`](skills/cave_prompt/) folder into your Claude Code project's `skills/` directory. Then invoke it with `/cave-prompt` or ask Claude to "compile this prompt."

---

## Installation (detailed)

### Python

```bash
# Option 1: pipx (recommended — isolated, no venv management)
pipx install cave-prompt

# Option 2: pip into a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install cave-prompt

# Option 3: pip globally (not recommended on macOS/Linux)
pip install cave-prompt

# Set your API key
export ANTHROPIC_API_KEY="sk-ant-..."   # Linux/macOS
set ANTHROPIC_API_KEY=sk-ant-...        # Windows CMD
$env:ANTHROPIC_API_KEY="sk-ant-..."     # Windows PowerShell

# Verify install
cave --help
cave compile "hello world"   # gate skips short prompts → passes through instantly
```

### TypeScript / Node

```bash
# Option 1: global install
npm install -g cave-prompt
cave compile "your prompt"

# Option 2: npx (no install)
npx cave-prompt compile "your prompt"

# Option 3: project dependency
npm install cave-prompt
# then use the SDK: import { compile } from "cave-prompt"

# Set your API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Verify
cave --help
```

### From source

```bash
git clone https://github.com/hieudeptrai196/cave_prompt.git
cd cave_prompt

# Python
cd packages/python
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest

# TypeScript
cd ../typescript
npm install
npm run build
npm test
```

---

## Output format

Every compile produces **4 sections** in machine-first order:

### 1. Semantic Analysis (JSON)
```json
{
  "intent": "primary task",
  "domain": "subject area",
  "entities": ["NestJS", "Redis"],
  "constraints": { "technical": [...], "performance": [...] },
  "priorities": ["scalability", "cost"],
  "response_preferences": { "tone": "technical", "verbosity": "concise" },
  "ambiguities": ["LLM provider not specified"],
  "hidden_requirements": ["stateless session", "backpressure handling"]
}
```

### 2. Optimized Prompt IR (JSON)
```json
{
  "task_type": "system design + implementation guide",
  "execution_requirements": ["NestJS 100k concurrent", "Redis session cache"],
  "context_priority": { "high": ["scalability"], "low": ["basic intro"] },
  "reasoning_mode": "technical depth, concise",
  "tool_requirements": []
}
```

### 3. Entropy Analysis (JSON + prose) — `include_entropy=true`
```json
{
  "semantic_density": 0.82,
  "redundant_spans": ["I want to", "please"],
  "low_information_spans": ["make it good"],
  "execution_critical_spans": ["100k", "Redis", "NestJS"],
  "summary": "High density. Noise: filler phrases. All technical spans critical."
}
```

### 4. Final Optimized Execution Prompt (text)
The compiled prompt, in the same language as your input, ready to send to the main LLM.

**Full envelope schema:** [`schema/`](schema/)

---

## Configuration

### Runtime defaults (in the prompt, overridable per-call)

| Config | Default | Description |
|---|---|---|
| `output_language` | `match-input` | Output language matches input |
| `ambiguity_policy` | `ask-first` | Blocking ambiguity → stop and ask; non-blocking → record and proceed |
| `execution_mode` | `compile-first` | Emit execution prompt, do NOT run it |
| `section_order` | `machine-first` | JSON before prose |
| `fidelity_mode` | `strict` | `strict`: enforce verbatim + warn on low fidelity; `compact`: heavier compression allowed |

### Token-economy options (`cave.config.json`)

Run `cave init` to generate a config file with all options and their trade-off notes:

```json
{
  "include_entropy": false,
  "verbatim_echo": false,
  "gate_enabled": true,
  "gate_min_chars": 280
}
```

| Option | Default | Flag | Trade-off |
|---|---|---|---|
| `include_entropy` | `false` | `--entropy` / `--no-entropy` | OFF saves output tokens; ON shows redundancy/density breakdown |
| `verbatim_echo` | `false` | `--verbatim-echo` / `--no-verbatim-echo` | OFF saves tokens (spans still preserved in prompt per A2); ON lists them for machine validation |
| `gate_enabled` | `true` | `--gate` / `--no-gate` | ON skips trivial prompts (0 LLM calls); OFF always compiles |
| `gate_min_chars` | `280` | `--gate-min-chars N` | Gate threshold — prompts below this length pass through unchanged |

---

## Meaning-fidelity

Cave Prompt protects against lossy compression without forwarding the original prompt verbatim (which would defeat the purpose):

- **A2 — Verbatim preservation:** Code, numbers, proper names, API identifiers, file paths, URLs, quoted strings, few-shot example pairs, and raw data are copied unchanged into the execution prompt and listed in `verbatim_spans`. Never paraphrased.
- **A3 — Surgical compression:** Only proven `redundant_spans` / `low_information_spans` are compressed. Everything else stays intact.
- **B1 — Fidelity signal:** `fidelity_score` (0–1) + `dropped_or_uncertain` list. In `--mode strict`, the CLI warns to stderr when score < 0.6.

---

## Claude Code skill

Copy the skill folder into your project:

```bash
cp -r skills/cave_prompt /your/project/.claude/skills/
```

Then in Claude Code: `/cave-prompt` or ask "compile this prompt with Cave Prompt."

---

## Examples

See [`examples/`](examples/) for worked transcripts:

- [`01-nestjs-chatbot.md`](examples/01-nestjs-chatbot.md) — Vietnamese input, language matching, verbatim span preservation
- [`02-blocking-ambiguity.md`](examples/02-blocking-ambiguity.md) — stop-and-ask behavior, exit code 2
- [`03-english-input.md`](examples/03-english-input.md) — English input with code block, A2 verbatim code preservation

---

## Cave Prompt vs. Direct Prompting

### The fundamental difference

**Direct prompting (one call):**
```
User → LLM → Answer
```

**Cave Prompt (compile-then-execute):**
```
User → [Cave Prompt / LLM #1] → IR + Execution Prompt → [Main LLM #2] → Answer
```

Cave Prompt **materializes** the understanding step — which normally happens silently inside the model — into an explicit, inspectable artifact. You pay one extra LLM call to get structure, consistency, and observability in return.

---

### Advantages of Cave Prompt

| Advantage | Detail |
|---|---|
| **Explicit intent extraction** | Surfaces hidden constraints and implicit requirements that raw prompts leave for the model to guess |
| **Consistency** | Different phrasings of the same intent collapse to the same IR → same downstream behavior |
| **Machine-readable IR** | Use `semantic_analysis` and `optimized_ir` for routing, logging, analytics, and schema validation |
| **Separation of concerns** | "Understanding the request" and "executing the request" are decoupled — each can be tested and optimised independently |
| **Reusability & caching** | The normalised execution prompt can be cached and reused across repeated requests of the same type |
| **Helps weaker models** | A small/cheap downstream model performs significantly better when given a clean, structured execution prompt |
| **Fidelity guarantee** | Verbatim spans (A2) ensure code, numbers, names, and examples are never paraphrased away |
| **Ambiguity detection** | Blocking ambiguities are caught at compile time — not discovered after a bad response |

---

### When to use Cave Prompt

**Use it when any of these are true:**

- **You run the same request type repeatedly** — compile once, cache the normalised prompt, run N times. The extra call amortises quickly.
- **You're building a pipeline or multi-agent system** — the IR gives each downstream agent a typed, validated input instead of raw text.
- **You need routing or analytics** — `task_type`, `domain`, and `priorities` let you route to the right model/handler without another LLM call.
- **Your inputs are messy or user-generated** — Cave Prompt normalises inconsistent phrasing into a stable IR before it hits your system.
- **You're working with a weaker or cheaper model downstream** — a clean, structured execution prompt can close most of the gap with a stronger model.
- **You need to detect ambiguity before executing** — blocking ambiguities surface at compile time, not after a bad response.
- **You need an audit trail** — the IR documents exactly what the system understood, which you can log and diff over time.

**Skip it when:**

- You're sending a one-off prompt to a strong frontier model — it already does intent extraction internally.
- You need minimal latency (realtime chat, streaming UX) — two sequential calls adds noticeable delay.
- Your prompt is short and unambiguous — the complexity gate will pass it through anyway, but if you're always hitting the gate, Cave Prompt adds no value.

---

### The one-sentence rule

> Direct prompting optimises for **one good answer, right now**.
> Cave Prompt optimises for **many consistent answers, observable, at scale**.

If you are not running at scale and do not need the IR, use a direct prompt.

---

## Development

```bash
# Python — sync assets, install, test
cd packages/python
python scripts/sync_assets.py
pip install -e ".[dev]"
pytest

# TypeScript — sync assets, install, build, test
cd packages/typescript
npm install
npm run sync   # copies prompt + schema into assets/
npm run build
npm test
```

**Asset sync:** `prompt/` and `schema/` at repo root are the single source of truth. Each package has a sync script that copies them into its bundle directory (`_data` for Python, `assets` for TypeScript). A drift-guard test in each package verifies the bundled copies match the root.

---

## License

MIT — see [LICENSE](LICENSE).
