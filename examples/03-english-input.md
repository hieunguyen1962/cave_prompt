# Example 03 — English input with code (language matching + A2 verbatim code preservation)

## Input

```
I need to refactor this Python function to be more efficient. It's currently O(n²) and
needs to handle up to 1M records. Here's the current code:

```python
def find_duplicates(items):
    duplicates = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            if items[i] == items[j] and items[i] not in duplicates:
                duplicates.append(items[i])
    return duplicates
```

It needs to stay pure Python (no numpy), work in Python 3.10+, and the output order
doesn't matter.
```

## Envelope (machine-readable)

```json
{
  "blocking_ambiguities": [],
  "semantic_analysis": {
    "intent": "Refactor a duplicate-finding function from O(n²) to a more efficient algorithm, handling 1M records",
    "domain": "Python algorithm optimization",
    "entities": ["find_duplicates", "items", "duplicates"],
    "constraints": {
      "technical": ["pure Python", "Python 3.10+", "no numpy"],
      "performance": ["handle up to 1M records", "reduce from O(n²)"],
      "business": ["output order doesn't matter"]
    },
    "priorities": ["time complexity reduction", "memory efficiency at scale", "standard library only"],
    "response_preferences": {
      "tone": "technical",
      "verbosity": "focused"
    },
    "ambiguities": ["memory budget not specified — assumed unconstrained for a set-based approach"],
    "hidden_requirements": [
      "preserve semantics: return list of values that appear more than once",
      "each duplicate value returned only once (current code ensures this)"
    ]
  },
  "optimized_ir": {
    "task_type": "code refactoring / algorithm optimization",
    "execution_requirements": [
      "replace O(n²) nested loop with O(n) set-based algorithm",
      "handle 1M records without numpy",
      "Python 3.10+ compatible",
      "output: list of duplicate values (order irrelevant)"
    ],
    "context_priority": {
      "high": ["algorithmic complexity reduction", "correctness preservation", "scale to 1M records"],
      "low": ["style preferences", "docstring format"]
    },
    "reasoning_mode": "algorithmic analysis + drop-in replacement code",
    "tool_requirements": []
  },
  "entropy_analysis": {
    "semantic_density": 0.78,
    "redundant_spans": ["I need to", "currently", "Here's the current code"],
    "low_information_spans": ["more efficient", "up to"],
    "execution_critical_spans": ["O(n²)", "1M records", "pure Python", "Python 3.10+", "find_duplicates", "items[i] == items[j]", "items[i] not in duplicates"],
    "summary": "Prompt has good density (0.78). Code block is entirely execution-critical and copied verbatim. Minor noise in framing sentences."
  },
  "verbatim_spans": [
    "O(n²)",
    "1M records",
    "pure Python",
    "Python 3.10+",
    "def find_duplicates(items):\n    duplicates = []\n    for i in range(len(items)):\n        for j in range(i + 1, len(items)):\n            if items[i] == items[j] and items[i] not in duplicates:\n                duplicates.append(items[i])\n    return duplicates"
  ],
  "fidelity_score": 0.96,
  "dropped_or_uncertain": [
    "memory budget — not specified, assumed unconstrained"
  ],
  "execution_prompt": "Refactor the following Python function to reduce complexity from O(n²) to O(n). Constraints: pure Python only (no numpy), Python 3.10+, handle 1M records, output order irrelevant. Preserve semantics: return a list of values appearing more than once, each listed once.\n\nCurrent implementation:\n\n```python\ndef find_duplicates(items):\n    duplicates = []\n    for i in range(len(items)):\n        for j in range(i + 1, len(items)):\n            if items[i] == items[j] and items[i] not in duplicates:\n                duplicates.append(items[i])\n    return duplicates\n```\n\nProvide the refactored function with a brief explanation of the algorithmic change."
}
```

## Human-readable render

### 1. Semantic Analysis

- **Intent:** Refactor `find_duplicates` from O(n²) to efficient algorithm for 1M records
- **Domain:** Python algorithm optimization
- **Constraints:** pure Python, Python 3.10+, no numpy, output order irrelevant
- **Hidden requirements:** preserve return semantics (list of duplicates, each once)

### 2. Optimized Prompt IR

- **Task type:** code refactoring / algorithm optimization
- **Key requirements:** O(n) set-based replacement, 1M scale, stdlib only
- **Reasoning mode:** algorithmic analysis + drop-in replacement

### 3. Entropy Analysis

Semantic density: **0.78**. Code block is 100% execution-critical — copied verbatim per A2. Noise: framing sentences only.

### 4. Final Optimized Execution Prompt

> Refactor the following Python function to reduce complexity from O(n²) to O(n). Constraints: pure Python only (no numpy), Python 3.10+, handle 1M records, output order irrelevant. Preserve semantics: return a list of values appearing more than once, each listed once.
>
> ```python
> def find_duplicates(items):
>     duplicates = []
>     for i in range(len(items)):
>         for j in range(i + 1, len(items)):
>             if items[i] == items[j] and items[i] not in duplicates:
>                 duplicates.append(items[i])
>     return duplicates
> ```
>
> Provide the refactored function with a brief explanation of the algorithmic change.

---

*Demonstrates: output_language=match-input (English in → English out), A2 verbatim preservation of code block and technical spans ("O(n²)", "1M records", "Python 3.10+"), surgical compression of framing noise.*
