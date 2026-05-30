# Example 02 — Blocking Ambiguity (stop-and-ask)

## Input

```
Làm cho tôi cái app.
```

## Envelope (machine-readable)

```json
{
  "blocking_ambiguities": [
    "App này dành cho nền tảng nào? (web, mobile iOS/Android, desktop, CLI?)",
    "Chức năng chính của app là gì? (e.g. quản lý task, ecommerce, social, tool nội bộ...)",
    "Stack công nghệ ưu tiên là gì, hoặc để tự chọn?"
  ],
  "semantic_analysis": {
    "intent": "",
    "domain": "",
    "entities": [],
    "constraints": {},
    "priorities": [],
    "response_preferences": {},
    "ambiguities": [
      "Nền tảng chưa rõ",
      "Chức năng chưa rõ",
      "Tech stack chưa rõ"
    ],
    "hidden_requirements": []
  },
  "optimized_ir": {
    "task_type": "",
    "execution_requirements": [],
    "context_priority": {},
    "reasoning_mode": "",
    "tool_requirements": []
  },
  "entropy_analysis": {
    "semantic_density": 0.05,
    "redundant_spans": [],
    "low_information_spans": ["Làm cho tôi cái app"],
    "execution_critical_spans": [],
    "summary": "Prompt có mật độ ngữ nghĩa cực thấp (0.05). Toàn bộ nội dung là yêu cầu mơ hồ không thể compile."
  },
  "verbatim_spans": [],
  "fidelity_score": 0.0,
  "dropped_or_uncertain": [],
  "execution_prompt": ""
}
```

## CLI behavior

```
$ cave compile "Làm cho tôi cái app."

Blocking ambiguity — clarify before compiling:
  - App này dành cho nền tảng nào? (web, mobile iOS/Android, desktop, CLI?)
  - Chức năng chính của app là gì? (e.g. quản lý task, ecommerce, social, tool nội bộ...)
  - Stack công nghệ ưu tiên là gì, hoặc để tự chọn?

[exit code 2]
```

## Notes

- `blocking_ambiguities` is non-empty → compilation is blocked.
- `execution_prompt` is intentionally empty — no execution prompt is produced.
- CLI exits with code 2 to signal "ambiguity, not an error".
- This is `ambiguity_policy=ask-first` in action: blocking ambiguities must be resolved before compiling.
- Non-blocking ambiguities (e.g., minor style preferences) would instead be recorded in `semantic_analysis.ambiguities` and compilation would proceed.

---

*Demonstrates: blocking ambiguity policy — stop-and-ask, no execution prompt generated, exit code 2.*
