# AI-Benchy (llama-benchy Apple UI)

A modern, Apple-styled (macOS Tahoe & iOS 18 design language) Next.js web application wrapping the CLI tool [**`llama-benchy`**](https://github.com/eugr/llama-benchy) for benchmarking any OpenAI-compatible LLM inference endpoint (vLLM, SGLang, Ollama, LM Studio, llama.cpp server).

---

## ✨ Features & Apple Design Highlights

- **macOS Tahoe Aesthetic**: Liquid crystal glassmorphism (`backdrop-blur-2xl`), traffic light window controls (🔴 🟡 🟢), SF Pro typography, smooth segmented controls, and animated iOS toggle switches.
- **Complete CLI Parameter Coverage**:
  - **Endpoint & Auth**: `--base-url`, `--api-key`, with real-time `/v1/models` ping & auto-discovery.
  - **Model & Tokenizer**: `--model`, `--served-model-name`, `--tokenizer`.
  - **Test Shapes**: Multi-token tag chips for `--pp` (prompt processing), `--tg` (generation), `--depth` (context depth sweep), `--concurrency` (parallel clients), and `--exact-tg`.
  - **Run Parameters**: `--runs`, `--warmup-runs`, `--no-warmup`.
  - **Latency & Prefix Caching**: `--latency-mode` (generation / api / none), `--enable-prefix-caching`, `--no-cache`, `--adapt-prompt`, `--skip-coherence`.
  - **Dataset & Text**: Project Gutenberg book source, `--book-url`, `--dataset-file`.
  - **Output & Timeseries**: `--format` (md / json / csv), `--save-result`, `--save-total-throughput-timeseries`, `--save-all-throughput-timeseries`, `--sample-interval`.
  - **Advanced Hooks**: `--post-run-cmd`, `--extra-body`, `--exit-on-first-fail`, `--no-results-on-fail`, `--verbose`.
- **Live Streaming & Real-Time HUD**:
  - Real-time Server-Sent Events (SSE) stream consuming `--emit-progress`.
  - Digital gauges for Prompt Processing Speed (`pp t/s`), Token Generation Speed (`tg t/s`), Time-To-First-Response (`TTFR ms`), and Peak Throughput.
  - Live filterable stdout console.
- **Interactive Visualizations (Recharts)**:
  - PP Speed vs Context Depth curve.
  - TG Speed vs Context Depth curve with peak comparison.
  - Latency breakdown (TTFR vs Est PPT vs E2E TTFT).
  - Concurrency scaling throughput charts.
  - Real-time throughput time-series stream graph.
- **Results Table & Multi-Format Export**:
  - Output table matching standard `llama-bench` markdown format with mean ± std.
  - 1-click Markdown copy, CSV export, and JSON export.
- **Session History & Side-by-Side Model Comparison**:
  - Save runs locally and compare 2 models side-by-side with delta speedup badges (`+14.2%`).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 🔧 Prerequisites for Real llama-benchy Execution

To run benchmarks directly against live inference backends, install `uv` (recommended):
```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or install llama-benchy directly
uv pip install -U git+https://github.com/eugr/llama-benchy
```

Alternatively, you can use the built-in **"Simulated Demo"** mode inside the UI to explore all analytics, charts, and table features instantly.
