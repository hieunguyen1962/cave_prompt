# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/), versioning per [SemVer](https://semver.org/).

## [1.0.0] - 2026-05-29
### Added
- Cave Prompt runtime spec (`prompt/cave_prompt.md`) + compressed variant (`prompt/cave_prompt.min.md`).
- Meaning-fidelity mechanism: verbatim spans, surgical compression, `fidelity_score`, `--mode strict|compact`.
- Token-economy options via `cave.config.json` + `cave init`: `include_entropy`, `verbatim_echo`, heuristic complexity gate.
- Claude Code skill (`skills/cave_prompt/SKILL.md`).
- JSON Schemas for semantic analysis and optimized IR.
- Python CLI/SDK (`cave`) and TypeScript CLI/SDK (`cave`).
- Worked examples and bilingual (EN/VI) documentation.
