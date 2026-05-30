# Cave Prompt

**[English](README.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue)](packages/python)
[![Node](https://img.shields.io/badge/node-18%2B-green)](packages/typescript)
[![CI](https://github.com/hieudeptrai196/cave_prompt/actions/workflows/ci.yml/badge.svg)](https://github.com/hieudeptrai196/cave_prompt/actions/workflows/ci.yml)

> Trình biên dịch prompt theo ngữ nghĩa / lớp IR — không phải chatbot.

---

## Prompt thông thường vs Cave Prompt

Hầu hết các pipeline LLM gửi thẳng text thô của người dùng vào model. Model tự diễn giải theo cách riêng — và bạn không bao giờ thấy nó đã hiểu gì, có bỏ sót constraint nào không, hay tại sao hai input tương tự lại cho output khác nhau.

Cave Prompt biến bước diễn giải đó thành **artifact tường minh, máy đọc được**.

```
# Không dùng Cave Prompt
User input ──────────────────────────────────► LLM ──► Answer
               (intent được hiểu ngầm, không ai thấy)

# Dùng Cave Prompt
User input ──► [Cave Prompt] ──► IR + Execution Prompt ──► LLM ──► Answer
                  ↓
       semantic_analysis  (hệ thống đã hiểu gì?)
       optimized_ir       (LLM cần làm gì?)
       fidelity_score     (bao nhiêu % ý nghĩa được giữ nguyên?)
       verbatim_spans     (đoạn nào không được paraphrase?)
```

| | Prompt thông thường | Cave Prompt |
|---|:---:|:---:|
| Intent được trích xuất tường minh | ✗ | ✅ |
| Hidden constraint được phát hiện | ✗ | ✅ |
| Output nhất quán dù diễn đạt khác nhau | ✗ | ✅ |
| IR máy đọc được để routing / logging | ✗ | ✅ |
| Phát hiện ambiguity trước khi thực thi | ✗ | ✅ |
| Code / số / tên riêng được bảo vệ verbatim | ✗ | ✅ |
| Dùng được với bất kỳ model nào | ✅ | ✅ |
| Cache & tái sử dụng cho request tương tự | ✗ | ✅ |
| Prompt caching (system prompt được cache xuyên suốt các lần gọi) | ✗ | ✅ |
| IR chuẩn hoá giảm cache miss | ✗ | ✅ |

> **Phù hợp nhất khi:** xây pipeline, batch processing, hệ thống multi-agent, request lặp lại nhiều lần, model downstream yếu hơn.  
> **Nên bỏ qua khi:** query một lần tới frontier model mạnh, chat realtime cần độ trễ thấp.
>
> **Về caching:** Cave Prompt gửi spec cốt lõi dưới dạng system prompt được cache (Anthropic prompt caching, TTL 5 phút). Execution prompt đã chuẩn hoá mà nó tạo ra ổn định dù người dùng diễn đạt khác nhau — nghĩa là cùng một intent vẫn hit cache của model downstream dù wording thay đổi. Trong batch hoặc pipeline, lợi ích này nhân lên: ít cache miss hơn, chi phí token thấp hơn, latency p50 nhanh hơn.

```
User Input → [Cave Prompt] → Optimized Execution Prompt → Main LLM
```

---

## Cave Prompt là gì?

Cave Prompt nằm giữa input thô của bạn và LLM chính. Nó **không trả lời câu hỏi của bạn** — nó biên dịch prompt thành một execution prompt cô đọng, có cấu trúc, kèm theo một Intermediate Representation (IR) máy đọc được.

Hình dung như front-end của compiler: phân tích intent, trích xuất constraints, giảm entropy, rồi chuyển prompt đã tối ưu cho model thực thi.

**Tại sao cần điều này:**

| Vấn đề với prompt thô | Giải pháp Cave Prompt |
|---|---|
| Model bỏ sót hidden constraint | `semantic_analysis` trích xuất tường minh |
| Cùng intent → output không nhất quán | Normalization chuẩn hoá về một IR |
| Không thấy model đã hiểu gì | IR máy đọc được để log, route, validate |
| Prompt dài lãng phí attention | Entropy reduction giữ nguyên signal |

**Giá trị tăng theo quy mô:** Cave Prompt phát huy tác dụng nhất với pipeline, batch processing, multi-agent và các loại request lặp lại. Với prompt một lần gửi tay, gate heuristic (`gate_enabled=true`) tự động bỏ qua compile.

---

## Bắt đầu nhanh

### Cách A — Prompt thuần (mọi LLM, không cần cài)

Copy nội dung [`prompt/cave_prompt.md`](prompt/cave_prompt.md) vào system prompt của ChatGPT, Claude.ai, Gemini hoặc bất kỳ API call nào. Rồi gửi yêu cầu của bạn như user message.

Nếu ô custom instruction bị giới hạn ký tự, dùng [`prompt/cave_prompt.min.md`](prompt/cave_prompt.min.md) (~2.8 KB).

### Cách B — Python CLI/SDK

**Yêu cầu:** Python 3.10+, biến môi trường `ANTHROPIC_API_KEY`.

```bash
# Cài đặt
pip install cave-prompt
# hoặc, cài isolated (khuyến nghị):
pipx install cave-prompt

# Compile một prompt
cave compile "Xây chatbot hỗ trợ khách hàng với NestJS, 100k user đồng thời, Redis cache session, stream token, hạ tầng rẻ"

# Đọc từ stdin
echo "prompt của bạn" | cave compile

# Chỉ xuất JSON máy đọc
cave compile "prompt của bạn" --json

# Compact mode (nén mạnh hơn, chấp nhận mất nhiều hơn)
cave compile "prompt của bạn" --mode compact

# Tạo cave.config.json với các tuỳ chọn tiết kiệm token
cave init
```

**Dùng như SDK:**

```python
from cave_prompt import compile

result = compile("Xây chatbot NestJS cho 100k user, Redis, stream token")
print(result.execution_prompt)
print(result.fidelity_score)
print(result.semantic_analysis)
```

### Cách C — TypeScript/Node CLI/SDK

**Yêu cầu:** Node.js 18+, biến môi trường `ANTHROPIC_API_KEY`.

```bash
# Cài global
npm install -g cave-prompt

# Hoặc chạy không cần cài
npx cave-prompt compile "prompt của bạn"

# Compile một prompt
cave compile "Xây chatbot NestJS 100k user đồng thời, Redis cache session, stream token"

# Chỉ xuất JSON
cave compile "prompt của bạn" --json

# Tạo cave.config.json
cave init
```

**Dùng như SDK:**

```typescript
import { compile } from "cave-prompt";

const result = await compile("Xây chatbot NestJS cho 100k user, Redis, stream token");
console.log(result.executionPrompt);
console.log(result.fidelityScore);
console.log(result.semanticAnalysis);
```

### Cách D — Claude Code skill

Copy folder [`skills/cave_prompt/`](skills/cave_prompt/) vào thư mục `skills/` trong project Claude Code của bạn. Rồi gọi bằng `/cave-prompt` hoặc yêu cầu Claude "compile prompt này."

---

## Cài đặt chi tiết

### Python

```bash
# Cách 1: pipx (khuyến nghị — isolated, không cần quản lý venv)
pipx install cave-prompt

# Cách 2: pip vào virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install cave-prompt

# Cách 3: pip global (không khuyến nghị trên macOS/Linux)
pip install cave-prompt

# Cấu hình API key
export ANTHROPIC_API_KEY="sk-ant-..."   # Linux/macOS
set ANTHROPIC_API_KEY=sk-ant-...        # Windows CMD
$env:ANTHROPIC_API_KEY="sk-ant-..."     # Windows PowerShell

# Kiểm tra cài đặt
cave --help
cave compile "xin chào"   # gate bỏ qua prompt ngắn → trả về ngay
```

### TypeScript / Node

```bash
# Cách 1: cài global
npm install -g cave-prompt
cave compile "prompt của bạn"

# Cách 2: npx (không cần cài)
npx cave-prompt compile "prompt của bạn"

# Cách 3: dependency trong project
npm install cave-prompt
# dùng SDK: import { compile } from "cave-prompt"

# Cấu hình API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Kiểm tra
cave --help
```

### Từ source code

```bash
git clone https://github.com/hieudeptrai196/cave_prompt.git
cd cave_prompt

# Python
cd packages/python
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest

# TypeScript
cd ../typescript
npm install
npm run build
npm test
```

---

## Định dạng output

Mỗi lần compile sinh ra **4 section** theo thứ tự máy trước, người sau:

### 1. Semantic Analysis (JSON)
```json
{
  "intent": "task chính",
  "domain": "lĩnh vực",
  "entities": ["NestJS", "Redis"],
  "constraints": { "technical": [...], "performance": [...] },
  "priorities": ["scalability", "cost"],
  "response_preferences": { "tone": "technical", "verbosity": "concise" },
  "ambiguities": ["LLM provider chưa chỉ định"],
  "hidden_requirements": ["stateless session", "backpressure handling"]
}
```

### 2. Optimized Prompt IR (JSON)
```json
{
  "task_type": "system design + implementation guide",
  "execution_requirements": ["NestJS 100k concurrent", "Redis session cache"],
  "context_priority": { "high": ["scalability"], "low": ["basic intro"] },
  "reasoning_mode": "technical depth, concise",
  "tool_requirements": []
}
```

### 3. Entropy Analysis (JSON + prose) — bật bằng `include_entropy=true`
```json
{
  "semantic_density": 0.82,
  "redundant_spans": ["Tôi muốn", "thôi"],
  "low_information_spans": ["làm cho nó tốt hơn"],
  "execution_critical_spans": ["100k", "Redis", "NestJS"],
  "summary": "Mật độ cao. Noise: filler phrases. Các span kỹ thuật đều critical."
}
```

### 4. Final Optimized Execution Prompt (text)
Prompt đã compile, cùng ngôn ngữ với input, sẵn sàng gửi cho LLM chính.

**Schema đầy đủ của envelope:** [`schema/`](schema/)

---

## Cấu hình

### Default runtime (ghi trong prompt, chỉnh được mỗi lần gọi)

| Config | Default | Mô tả |
|---|---|---|
| `output_language` | `match-input` | Ngôn ngữ output khớp với input |
| `ambiguity_policy` | `ask-first` | Mơ hồ chặn → dừng hỏi; mơ hồ nhẹ → ghi lại và tiếp tục |
| `execution_mode` | `compile-first` | Sinh execution prompt rồi dừng, KHÔNG tự chạy |
| `section_order` | `machine-first` | JSON trước, prose sau |
| `fidelity_mode` | `strict` | `strict`: giữ nguyên văn, cảnh báo fidelity thấp; `compact`: nén mạnh hơn |

### Tuỳ chọn tiết kiệm token (`cave.config.json`)

Chạy `cave init` để sinh file config với đầy đủ option và note đánh đổi:

```json
{
  "include_entropy": false,
  "verbatim_echo": false,
  "gate_enabled": true,
  "gate_min_chars": 280
}
```

| Option | Default | Flag | Đánh đổi |
|---|---|---|---|
| `include_entropy` | `false` | `--entropy` / `--no-entropy` | TẮT tiết kiệm token output; BẬT hiển thị phân tích redundancy/density |
| `verbatim_echo` | `false` | `--verbatim-echo` / `--no-verbatim-echo` | TẮT tiết kiệm token (span vẫn được giữ trong prompt theo A2); BẬT liệt kê riêng cho machine validation |
| `gate_enabled` | `true` | `--gate` / `--no-gate` | BẬT bỏ qua prompt tầm thường (0 LLM call); TẮT để luôn compile |
| `gate_min_chars` | `280` | `--gate-min-chars N` | Ngưỡng gate — prompt ngắn hơn này sẽ được trả về nguyên xi |

---

## Bảo toàn ý nghĩa (Meaning-fidelity)

Cave Prompt bảo vệ chống mất nghĩa khi nén mà không cần truyền kèm prompt gốc nguyên văn:

- **A2 — Giữ nguyên văn:** Code, số+đơn vị, tên riêng, API id, file path, URL, chuỗi trích dẫn, cặp ví dụ few-shot, dữ liệu → copy nguyên xi vào execution prompt và liệt kê trong `verbatim_spans`. Không bao giờ paraphrase.
- **A3 — Nén có phẫu thuật:** Chỉ nén các span đã chứng minh là `redundant_spans` / `low_information_spans`. Mọi thứ còn lại giữ nguyên.
- **B1 — Tín hiệu fidelity:** `fidelity_score` (0–1) + danh sách `dropped_or_uncertain`. Ở `--mode strict`, CLI cảnh báo ra stderr khi điểm < 0.6.

---

## Claude Code skill

Copy folder skill vào project:

```bash
cp -r skills/cave_prompt /your/project/.claude/skills/
```

Rồi trong Claude Code: `/cave-prompt` hoặc yêu cầu "compile prompt này với Cave Prompt."

---

## Ví dụ

Xem [`examples/`](examples/) để xem transcript đầy đủ:

- [`01-nestjs-chatbot.md`](examples/01-nestjs-chatbot.md) — Input tiếng Việt, language matching, giữ nguyên văn các span kỹ thuật
- [`02-blocking-ambiguity.md`](examples/02-blocking-ambiguity.md) — Hành vi dừng-và-hỏi, exit code 2
- [`03-english-input.md`](examples/03-english-input.md) — Input tiếng Anh có code block, A2 giữ nguyên code

---

## Cave Prompt vs. Prompt thông thường

### Sự khác biệt cốt lõi

**Prompt thông thường (1 lần gọi):**
```
User → LLM → Đáp án
```

**Cave Prompt (compile rồi mới chạy):**
```
User → [Cave Prompt / LLM #1] → IR + Execution Prompt → [LLM chính #2] → Đáp án
```

Cave Prompt **vật chất hoá** bước "hiểu yêu cầu" — vốn diễn ra im lặng bên trong model — thành một artifact tường minh, có thể inspect được. Bạn trả giá bằng một lần gọi LLM thêm, đổi lại là cấu trúc, tính nhất quán và khả năng quan sát.

---

### Ưu điểm của Cave Prompt

| Ưu điểm | Chi tiết |
|---|---|
| **Trích xuất intent tường minh** | Phát hiện hidden constraint và yêu cầu ngầm mà prompt thô để model tự đoán |
| **Tính nhất quán** | Các cách diễn đạt khác nhau của cùng intent đều về một IR → downstream xử lý như nhau |
| **IR máy đọc được** | Dùng `semantic_analysis` và `optimized_ir` để routing, logging, analytics, validate bằng schema |
| **Tách mối quan tâm** | "Hiểu yêu cầu" và "thực thi yêu cầu" tách rời — mỗi phần có thể test và tối ưu độc lập |
| **Tái sử dụng & cache** | Execution prompt đã chuẩn hoá có thể cache và dùng lại cho các request cùng loại |
| **Giúp model yếu** | Model nhỏ/rẻ ở downstream làm tốt hơn đáng kể khi nhận prompt sạch, có cấu trúc |
| **Bảo đảm fidelity** | Verbatim spans (A2) đảm bảo code, số, tên, ví dụ không bao giờ bị paraphrase mất |
| **Phát hiện mơ hồ** | Blocking ambiguity bị bắt lúc compile — không phải sau khi đã nhận response sai |

---

### Khi nào nên dùng Cave Prompt

**Dùng khi có bất kỳ điều nào sau đây đúng:**

- **Bạn chạy cùng loại request nhiều lần** — compile một lần, cache execution prompt đã chuẩn hoá, chạy N lần. Chi phí call thêm được phân bổ nhanh.
- **Bạn đang xây pipeline hoặc hệ multi-agent** — IR cho mỗi agent downstream một input có kiểu, đã validate, thay vì text thô.
- **Bạn cần routing hoặc analytics** — `task_type`, `domain`, `priorities` cho phép route đến đúng model/handler mà không cần thêm LLM call.
- **Input đến từ user, lộn xộn hoặc không nhất quán** — Cave Prompt chuẩn hoá các cách diễn đạt khác nhau về một IR ổn định trước khi vào hệ thống.
- **Model downstream yếu hoặc rẻ hơn** — execution prompt sạch, có cấu trúc có thể thu hẹp phần lớn khoảng cách với model mạnh hơn.
- **Bạn cần phát hiện mơ hồ trước khi chạy** — blocking ambiguity bị bắt lúc compile, không phải sau khi đã nhận response sai.
- **Bạn cần audit trail** — IR ghi lại chính xác hệ thống đã hiểu gì, có thể log và diff theo thời gian.

**Bỏ qua khi:**

- Bạn gửi prompt một lần đến frontier model mạnh — model đó đã tự làm intent extraction ngầm rất tốt.
- Bạn cần latency thấp (chat realtime, streaming UX) — hai call tuần tự thêm độ trễ rõ rệt.
- Prompt ngắn và rõ ràng — complexity gate sẽ tự bỏ qua compile, nhưng nếu bạn luôn hit gate thì Cave Prompt không đem lại giá trị gì.

---

### Một câu để nhớ

> Prompt thường tối ưu cho **một câu trả lời tốt, ngay bây giờ**.
> Cave Prompt tối ưu cho **nhiều câu trả lời nhất quán, quan sát được, ở quy mô**.

Nếu bạn không chạy ở quy mô và không cần IR, hãy dùng prompt thường.

---

## Development

```bash
# Python — sync assets, cài, test
cd packages/python
python scripts/sync_assets.py
pip install -e ".[dev]"
pytest

# TypeScript — sync assets, cài, build, test
cd packages/typescript
npm install
npm run sync   # copy prompt + schema vào assets/
npm run build
npm test
```

**Asset sync:** `prompt/` và `schema/` ở gốc repo là nguồn chân lý duy nhất. Mỗi package có script sync copy chúng vào bundle directory riêng (`_data` cho Python, `assets` cho TypeScript). Drift-guard test trong mỗi package xác nhận bản bundle khớp với bản gốc.

---

## License

MIT — xem [LICENSE](LICENSE).
