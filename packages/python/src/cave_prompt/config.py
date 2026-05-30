"""Token-economy config loaded from cave.config.json (cwd then home)."""
from __future__ import annotations
from dataclasses import dataclass, asdict, fields
from pathlib import Path
import json

CONFIG_NAME = "cave.config.json"

OPTION_NOTES = {
    "include_entropy": "OFF saves output tokens; ON shows the redundancy/density breakdown.",
    "verbatim_echo": "OFF saves output tokens (spans stay inside execution_prompt); "
                     "ON also lists them for machine validation.",
    "gate_enabled": "ON skips compiling trivial prompts (no LLM call); OFF always compiles.",
}


@dataclass
class Config:
    include_entropy: bool = False   # B2
    verbatim_echo: bool = False     # B3
    gate_enabled: bool = True       # C3
    gate_min_chars: int = 280


def load_config() -> Config:
    keys = {f.name for f in fields(Config)}
    for base in (Path.cwd(), Path.home()):
        f = base / CONFIG_NAME
        if f.exists():
            data = json.loads(f.read_text(encoding="utf-8"))
            return Config(**{k: v for k, v in data.items() if k in keys})
    return Config()


def write_default_config(path: Path) -> Config:
    cfg = Config()
    path.write_text(json.dumps(asdict(cfg), indent=2) + "\n", encoding="utf-8")
    return cfg
