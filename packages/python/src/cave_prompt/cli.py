"""`cave` command-line interface."""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

from cave_prompt.compiler import compile, CompileResult, BlockingAmbiguity, DEFAULT_MODEL
from cave_prompt.config import (Config, load_config, write_default_config,
                                CONFIG_NAME, OPTION_NOTES)

FIDELITY_THRESHOLD = 0.6


def render_json(r: CompileResult) -> str:
    return json.dumps(r.raw, ensure_ascii=False, indent=2)


def render_human(r: CompileResult) -> str:
    def block(title, obj):
        return f"## {title}\n\n```json\n{json.dumps(obj, ensure_ascii=False, indent=2)}\n```\n"
    return "\n".join([
        block("1. Semantic Analysis", r.semantic_analysis),
        block("2. Optimized Prompt IR", r.optimized_ir),
        block("3. Entropy Analysis", r.entropy_analysis),
        "## 4. Final Optimized Execution Prompt\n\n" + r.execution_prompt + "\n",
    ])


def warn_if_low_fidelity(r: CompileResult, mode: str) -> None:
    if mode == "strict" and r.fidelity_score < FIDELITY_THRESHOLD:
        print(f"warning: low fidelity_score={r.fidelity_score:.2f}; "
              f"the compiled prompt may have lost meaning.", file=sys.stderr)
        for item in r.dropped_or_uncertain:
            print(f"  dropped/uncertain: {item}", file=sys.stderr)


def _add_bool_flag(p: argparse.ArgumentParser, name: str, dest: str, note: str) -> None:
    g = p.add_mutually_exclusive_group()
    g.add_argument(f"--{name}", dest=dest, action="store_true", default=None, help=note)
    g.add_argument(f"--no-{name}", dest=dest, action="store_false")


def _resolve_config(args: argparse.Namespace) -> Config:
    cfg = load_config()
    if args.entropy is not None: cfg.include_entropy = args.entropy
    if args.verbatim_echo is not None: cfg.verbatim_echo = args.verbatim_echo
    if args.gate is not None: cfg.gate_enabled = args.gate
    if args.gate_min_chars is not None: cfg.gate_min_chars = args.gate_min_chars
    return cfg


def _cmd_init() -> int:
    path = Path.cwd() / CONFIG_NAME
    if path.exists():
        print(f"{CONFIG_NAME} already exists; leaving it untouched.", file=sys.stderr)
        return 0
    write_default_config(path)
    print(f"wrote {path}")
    for key, note in OPTION_NOTES.items():
        print(f"  {key}: {note}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="cave")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init", help=f"Scaffold {CONFIG_NAME} with token-economy options")

    c = sub.add_parser("compile", help="Compile a prompt into an optimized execution prompt")
    c.add_argument("prompt", nargs="?", help="Prompt text (reads stdin if omitted)")
    c.add_argument("--json", action="store_true", help="Emit only the machine-readable envelope")
    c.add_argument("--model", default=DEFAULT_MODEL)
    c.add_argument("--lang", default="auto")
    c.add_argument("--mode", default="strict", choices=["strict", "compact"],
                   help="fidelity_mode: strict preserves meaning, compact compresses harder")
    _add_bool_flag(c, "entropy", "entropy", "B2: " + OPTION_NOTES["include_entropy"])
    _add_bool_flag(c, "verbatim-echo", "verbatim_echo", "B3: " + OPTION_NOTES["verbatim_echo"])
    _add_bool_flag(c, "gate", "gate", "C3: " + OPTION_NOTES["gate_enabled"])
    c.add_argument("--gate-min-chars", dest="gate_min_chars", type=int, default=None)
    args = parser.parse_args(argv)

    if args.cmd == "init":
        return _cmd_init()

    text = args.prompt if args.prompt is not None else sys.stdin.read()
    if not text.strip():
        print("error: empty prompt", file=sys.stderr)
        return 1
    cfg = _resolve_config(args)
    try:
        result = compile(text, model=args.model, lang=args.lang, mode=args.mode, config=cfg)
    except BlockingAmbiguity as e:
        print("Blocking ambiguity — clarify before compiling:", file=sys.stderr)
        for q in e.questions:
            print(f"  - {q}", file=sys.stderr)
        return 2
    if not result.compiled:
        print("skipped: prompt below gate threshold; passed through unchanged.", file=sys.stderr)
        print(result.execution_prompt)
        return 0
    warn_if_low_fidelity(result, args.mode)
    print(render_json(result) if args.json else render_human(result))
    return 0
