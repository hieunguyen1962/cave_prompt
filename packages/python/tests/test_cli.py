import json
from cave_prompt import cli
from cave_prompt.compiler import CompileResult

def _fake_result(fidelity=0.9):
    return CompileResult(
        semantic_analysis={"intent": "x"}, optimized_ir={"task_type": "t"},
        entropy_analysis={"summary": "ok"}, execution_prompt="Do X.",
        verbatim_spans=["Redis"], fidelity_score=fidelity, dropped_or_uncertain=[],
        compiled=True,
        raw={"execution_prompt": "Do X.", "semantic_analysis": {"intent": "x"},
             "optimized_ir": {"task_type": "t"}, "entropy_analysis": {"summary": "ok"},
             "verbatim_spans": ["Redis"], "fidelity_score": fidelity,
             "dropped_or_uncertain": [], "compiled": True})

def test_render_human_has_four_sections():
    out = cli.render_human(_fake_result())
    assert "Semantic Analysis" in out
    assert "Optimized Prompt IR" in out
    assert "Entropy Analysis" in out
    assert "Final Optimized Execution Prompt" in out
    assert "Do X." in out

def test_render_json_is_envelope():
    out = cli.render_json(_fake_result())
    assert json.loads(out)["execution_prompt"] == "Do X."

def test_low_fidelity_warns_in_strict(capsys):
    cli.warn_if_low_fidelity(_fake_result(fidelity=0.4), mode="strict")
    assert "fidelity" in capsys.readouterr().err.lower()

def test_low_fidelity_silent_in_compact(capsys):
    cli.warn_if_low_fidelity(_fake_result(fidelity=0.4), mode="compact")
    assert capsys.readouterr().err == ""

def test_main_gate_skips_simple_prompt(capsys):
    # short prompt + default gate → passthrough, no network call
    code = cli.main(["compile", "hi there"])
    assert code == 0
    out = capsys.readouterr()
    assert "hi there" in out.out
    assert "skipped" in out.err.lower()

def test_init_writes_config(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert cli.main(["init"]) == 0
    assert (tmp_path / "cave.config.json").exists()
