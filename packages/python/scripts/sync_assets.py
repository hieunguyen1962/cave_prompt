"""Copy shared root assets (prompt + schema) into the Python package bundle."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[3]          # cave_prompt/
DATA = Path(__file__).resolve().parents[1] / "src" / "cave_prompt" / "_data"

ASSETS = [
    ROOT / "prompt" / "cave_prompt.md",
    ROOT / "schema" / "semantic-analysis.schema.json",
    ROOT / "schema" / "optimized-ir.schema.json",
]

def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    for src in ASSETS:
        shutil.copy2(src, DATA / src.name)
        print(f"synced {src.name}")

if __name__ == "__main__":
    main()
