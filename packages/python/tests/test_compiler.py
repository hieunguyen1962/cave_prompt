import json
import pytest
from cave_prompt import compile, BlockingAmbiguity
from cave_prompt.config import Config

# Disable the gate + request all sections so the LLM path runs deterministically.
NOGATE = Config(gate_enabled=False, include_entropy=True, verbatim_echo=True)

ENVELOPE = {
    "blocking_ambiguities": [],
    "semantic_analysis": {"intent": "x", "domain": "d", "entities": [], "constraints": {},
                          "priorities": [], "response_preferences": {}, "ambiguities": [],
                          "hidden_requirements": []},
    "optimized_ir": {"task_type": "t", "execution_requirements": [], "context_priority": {},
                     "reasoning_mode": "r", "tool_requirements": []},
    "entropy_analysis": {"semantic_density": 0.8, "redundant_spans": [],
                         "low_information_spans": [], "execution_critical_spans": [],
                         "summary": "ok"},
    "verbatim_spans": ["100k", "Redis"],
    "fidelity_score": 0.92,
    "dropped_or_uncertain": [],
    "execution_prompt": "Do X concisely.",
}

class _FakeMsg:
    def __init__(self, text): self.content = [type("B", (), {"type": "text", "text": text})()]

class _FakeClient:
    def __init__(self, payload): self._payload = payload; self.calls = 0; self.messages = self
    def create(self, **kwargs):
        self.calls += 1
        _FakeClient.last_kwargs = kwargs
        return _FakeMsg(self._payload)

def test_compile_parses_and_validates():
    client = _FakeClient(json.dumps(ENVELOPE))
    result = compile("build me a thing", config=NOGATE, client=client)
    assert result.compiled is True
    assert result.execution_prompt == "Do X concisely."
    assert result.semantic_analysis["intent"] == "x"
    assert result.optimized_ir["task_type"] == "t"

def test_compile_exposes_fidelity_fields():
    client = _FakeClient(json.dumps(ENVELOPE))
    result = compile("x", config=NOGATE, client=client)
    assert result.fidelity_score == 0.92
    assert result.verbatim_spans == ["100k", "Redis"]
    assert result.dropped_or_uncertain == []

def test_compile_uses_cached_system_block():
    client = _FakeClient(json.dumps(ENVELOPE))
    compile("hi", config=NOGATE, client=client)
    sys_block = _FakeClient.last_kwargs["system"][0]
    assert sys_block["cache_control"] == {"type": "ephemeral"}

def test_mode_is_injected_into_prompt():
    client = _FakeClient(json.dumps(ENVELOPE))
    compile("hi", mode="compact", config=NOGATE, client=client)
    user_msg = _FakeClient.last_kwargs["messages"][0]["content"]
    assert "fidelity_mode=compact" in user_msg

def test_options_omit_sections_from_instruction():
    client = _FakeClient(json.dumps(ENVELOPE))
    cfg = Config(gate_enabled=False, include_entropy=False, verbatim_echo=False)
    compile("a fairly long prompt that exceeds the gate threshold " * 6, config=cfg, client=client)
    user_msg = _FakeClient.last_kwargs["messages"][0]["content"]
    assert "entropy_analysis" not in user_msg
    assert "verbatim_spans" not in user_msg

def test_gate_skips_simple_prompt_without_calling_llm():
    client = _FakeClient(json.dumps(ENVELOPE))
    result = compile("hi there", config=Config(gate_enabled=True, gate_min_chars=280), client=client)
    assert result.compiled is False
    assert result.execution_prompt == "hi there"
    assert client.calls == 0

def test_blocking_ambiguity_raises():
    env = dict(ENVELOPE, blocking_ambiguities=["Which platform?"])
    client = _FakeClient(json.dumps(env))
    with pytest.raises(BlockingAmbiguity) as e:
        compile("vague", config=NOGATE, client=client)
    assert "Which platform?" in e.value.questions

def test_invalid_schema_raises():
    bad = dict(ENVELOPE, semantic_analysis={"intent": ""})  # missing required keys
    client = _FakeClient(json.dumps(bad))
    with pytest.raises(ValueError):
        compile("x", config=NOGATE, client=client)
