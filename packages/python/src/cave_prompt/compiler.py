"""Core compiler: send the user prompt through Cave Prompt, return a validated result."""
from __future__ import annotations
from dataclasses import dataclass
import json
import re
from typing import Any

import jsonschema

from cave_prompt import resources
from cave_prompt.config import Config, load_config

DEFAULT_MODEL = "claude-opus-4-8"
MAX_TOKENS = 4096


def _envelope_instruction(include_entropy: bool, verbatim_echo: bool) -> str:
    keys = ["blocking_ambiguities (array of strings)", "semantic_analysis", "optimized_ir"]
    if include_entropy:
        keys.append("entropy_analysis")
    if verbatim_echo:
        keys.append("verbatim_spans (array of strings copied unchanged from the input: "
                    "code, numbers, names, quoted text, few-shot examples, data)")
    keys += ["fidelity_score (0-1)", "dropped_or_uncertain (array of strings)", "execution_prompt"]
    rule = ("Preserve all literal spans (code, numbers, names, quoted text, few-shot examples, "
            "data) unchanged inside execution_prompt")
    if verbatim_echo:
        rule += " and also list them in verbatim_spans"
    return (
        "Return ONLY a single JSON object (no prose, no code fences) with keys: "
        + ", ".join(keys) + ". " + rule + "; compress only redundant/low-information spans. "
        "If there are blocking ambiguities that prevent a correct compile, put the clarifying "
        "questions in blocking_ambiguities and leave execution_prompt empty."
    )


class BlockingAmbiguity(Exception):
    def __init__(self, questions: list[str]):
        self.questions = questions
        super().__init__("Blocking ambiguity: " + "; ".join(questions))


@dataclass
class CompileResult:
    semantic_analysis: dict[str, Any]
    optimized_ir: dict[str, Any]
    entropy_analysis: dict[str, Any]
    execution_prompt: str
    verbatim_spans: list[str]
    fidelity_score: float
    dropped_or_uncertain: list[str]
    compiled: bool
    raw: dict[str, Any]


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if not m:
            raise ValueError("Model did not return JSON")
        return json.loads(m.group(0))


def _is_simple(prompt: str, min_chars: int) -> bool:
    """Heuristic gate: short, single-idea prompts with no code/structure are 'simple'."""
    p = prompt.strip()
    return len(p) < min_chars and "```" not in p and p.count("\n") < 3


def _passthrough(prompt: str) -> CompileResult:
    p = prompt.strip()
    return CompileResult(
        semantic_analysis={}, optimized_ir={}, entropy_analysis={}, execution_prompt=p,
        verbatim_spans=[], fidelity_score=1.0, dropped_or_uncertain=[], compiled=False,
        raw={"compiled": False, "execution_prompt": p},
    )


def compile(prompt: str, *, model: str | None = None, lang: str = "auto",
            mode: str | None = None, config: Config | None = None,
            client: Any | None = None) -> CompileResult:
    cfg = config or load_config()
    model = model or DEFAULT_MODEL
    mode = mode or "strict"

    if cfg.gate_enabled and _is_simple(prompt, cfg.gate_min_chars):
        return _passthrough(prompt)

    if client is None:
        from anthropic import Anthropic
        client = Anthropic()

    system = resources.system_prompt()
    directives = [f"fidelity_mode={mode}"]
    if lang != "auto":
        directives.append(f"output_language={lang}")
    instruction = _envelope_instruction(cfg.include_entropy, cfg.verbatim_echo)
    user = f"[{', '.join(directives)}]\n{prompt}\n\n---\n{instruction}"

    msg = client.messages.create(
        model=model,
        max_tokens=MAX_TOKENS,
        system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": user}],
    )
    text = "".join(b.text for b in msg.content if getattr(b, "type", None) == "text")
    env = _extract_json(text)

    blocking = env.get("blocking_ambiguities") or []
    if blocking:
        raise BlockingAmbiguity(blocking)

    try:
        jsonschema.validate(env["semantic_analysis"], resources.schema("semantic-analysis"))
        jsonschema.validate(env["optimized_ir"], resources.schema("optimized-ir"))
    except jsonschema.ValidationError as e:
        raise ValueError(f"Schema validation failed: {e.message}") from e

    return CompileResult(
        semantic_analysis=env["semantic_analysis"],
        optimized_ir=env["optimized_ir"],
        entropy_analysis=env.get("entropy_analysis", {}),
        execution_prompt=env.get("execution_prompt", ""),
        verbatim_spans=env.get("verbatim_spans", []),
        fidelity_score=float(env.get("fidelity_score", 1.0)),
        dropped_or_uncertain=env.get("dropped_or_uncertain", []),
        compiled=True,
        raw=env,
    )
