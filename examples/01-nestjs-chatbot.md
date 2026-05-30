# Example 01 — NestJS Chatbot (Vietnamese input, language matching + verbatim preservation)

## Input

```
Tôi muốn xây chatbot cho hệ thống hỗ trợ khách hàng với NestJS, cần handle 100k user đồng thời, dùng Redis để cache session, có stream token. Hạ tầng phải rẻ thôi, và cần response technical ngắn gọn.
```

## Envelope (machine-readable)

```json
{
  "blocking_ambiguities": [],
  "semantic_analysis": {
    "intent": "Xây dựng chatbot hỗ trợ khách hàng trên NestJS chịu tải cao, có streaming và Redis cache",
    "domain": "Backend engineering / conversational AI",
    "entities": ["NestJS", "Redis", "chatbot", "khách hàng"],
    "constraints": {
      "technical": ["NestJS framework", "Redis session cache", "token streaming"],
      "performance": ["100k concurrent users"],
      "cost": ["hạ tầng rẻ"]
    },
    "priorities": ["concurrency scalability", "cost efficiency", "streaming UX"],
    "response_preferences": {
      "tone": "technical",
      "verbosity": "concise"
    },
    "ambiguities": ["LLM provider chưa chỉ định", "database/storage chưa rõ"],
    "hidden_requirements": [
      "stateless or externalized session management",
      "backpressure handling for token streams",
      "horizontal scaling capability"
    ]
  },
  "optimized_ir": {
    "task_type": "system design + implementation guide",
    "execution_requirements": [
      "NestJS architecture for 100k concurrent users",
      "Redis session caching strategy",
      "SSE or WebSocket token streaming with backpressure",
      "cost-optimized infrastructure recommendations"
    ],
    "context_priority": {
      "high": ["scalability architecture", "Redis integration", "streaming implementation"],
      "low": ["basic NestJS setup", "boilerplate code", "introductory explanations"]
    },
    "reasoning_mode": "technical depth with concise output",
    "tool_requirements": []
  },
  "entropy_analysis": {
    "semantic_density": 0.82,
    "redundant_spans": ["Tôi muốn", "thôi"],
    "low_information_spans": ["cần response technical ngắn gọn"],
    "execution_critical_spans": ["100k", "Redis", "NestJS", "stream token"],
    "summary": "Prompt có mật độ ngữ nghĩa cao (0.82). Noise chính: filler đầu câu ('Tôi muốn') và qualifier cuối ('thôi'). Tất cả span kỹ thuật đều execution-critical và được giữ nguyên văn."
  },
  "verbatim_spans": ["100k", "Redis", "NestJS", "stream token"],
  "fidelity_score": 0.95,
  "dropped_or_uncertain": [
    "ngắn gọn — interpreted as concise technical depth, not brevity at cost of completeness"
  ],
  "execution_prompt": "Thiết kế và hướng dẫn implement chatbot hỗ trợ khách hàng trên NestJS chịu tải 100k concurrent users. Yêu cầu cứng: cache session bằng Redis, hỗ trợ stream token (SSE hoặc WebSocket) với backpressure handling, hạ tầng cost-optimized. Ưu tiên output: scalability architecture, Redis session strategy, streaming implementation. Bỏ qua intro cơ bản NestJS. Format: technical, súc tích."
}
```

## Human-readable render

### 1. Semantic Analysis

- **Intent:** Xây dựng chatbot hỗ trợ khách hàng trên NestJS chịu tải cao, có streaming và Redis cache
- **Domain:** Backend engineering / conversational AI
- **Entities:** NestJS, Redis, chatbot, khách hàng
- **Constraints:** technical (NestJS, Redis, streaming), performance (100k users), cost (rẻ)
- **Hidden requirements:** stateless session, backpressure, horizontal scaling

### 2. Optimized Prompt IR

- **Task type:** system design + implementation guide
- **Reasoning mode:** technical depth, concise output
- **High priority:** scalability, Redis, streaming
- **Low priority:** boilerplate, intro

### 3. Entropy Analysis

Semantic density: **0.82** — cao. Removed noise: filler phrases. All technical spans are execution-critical and preserved verbatim.

### 4. Final Optimized Execution Prompt

> Thiết kế và hướng dẫn implement chatbot hỗ trợ khách hàng trên NestJS chịu tải 100k concurrent users. Yêu cầu cứng: cache session bằng Redis, hỗ trợ stream token (SSE hoặc WebSocket) với backpressure handling, hạ tầng cost-optimized. Ưu tiên output: scalability architecture, Redis session strategy, streaming implementation. Bỏ qua intro cơ bản NestJS. Format: technical, súc tích.

---

*Demonstrates: output_language=match-input (Vietnamese in → Vietnamese out), verbatim preservation of "100k", "Redis", "NestJS", "stream token", high semantic density.*
