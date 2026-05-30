from pathlib import Path
import filecmp

ROOT = Path(__file__).resolve().parents[3]            # repo gốc cave_prompt/
DATA = Path(__file__).resolve().parents[1] / "src" / "cave_prompt" / "_data"

PAIRS = [
    (ROOT / "prompt" / "cave_prompt.md", DATA / "cave_prompt.md"),
    (ROOT / "schema" / "semantic-analysis.schema.json", DATA / "semantic-analysis.schema.json"),
    (ROOT / "schema" / "optimized-ir.schema.json", DATA / "optimized-ir.schema.json"),
]

def test_bundled_assets_match_root():
    for src, bundled in PAIRS:
        assert bundled.exists(), f"missing {bundled}; run scripts/sync_assets.py"
        assert filecmp.cmp(src, bundled, shallow=False), f"{bundled.name} drifted; re-sync"
