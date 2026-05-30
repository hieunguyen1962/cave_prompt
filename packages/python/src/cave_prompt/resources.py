"""Load bundled assets (system prompt + JSON schemas) from package data."""
from importlib.resources import files
import json
from functools import lru_cache

_DATA = files("cave_prompt") / "_data"

@lru_cache(maxsize=1)
def system_prompt() -> str:
    return (_DATA / "cave_prompt.md").read_text(encoding="utf-8")

@lru_cache(maxsize=4)
def schema(name: str) -> dict:
    return json.loads((_DATA / f"{name}.schema.json").read_text(encoding="utf-8"))
