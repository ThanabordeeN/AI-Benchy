# AI-Benchy (llama-benchy & EvalScope Apple UI)

[![CI](https://github.com/ThanabordeeN/AI-Benchy/actions/workflows/ci.yml/badge.svg)](https://github.com/ThanabordeeN/AI-Benchy/actions/workflows/ci.yml)
[![Dev Pipeline](https://github.com/ThanabordeeN/AI-Benchy/actions/workflows/dev.yml/badge.svg)](https://github.com/ThanabordeeN/AI-Benchy/actions/workflows/dev.yml)
[![Release on Main](https://github.com/ThanabordeeN/AI-Benchy/actions/workflows/release.yml/badge.svg)](https://github.com/ThanabordeeN/AI-Benchy/actions/workflows/release.yml)

A modern, Apple-styled (macOS Tahoe & iOS 18 design language) Next.js web application and standalone multiplatform desktop app wrapping [**`llama-benchy`**](https://github.com/eugr/llama-benchy) and [**`EvalScope` Needle-In-A-Haystack**](https://github.com/modelscope/evalscope) for benchmarking OpenAI-compatible LLM inference endpoints (vLLM, SGLang, Ollama, LM Studio, llama.cpp server).

---

## ✨ Features & Apple Design Highlights

- **macOS Tahoe Aesthetic**: Liquid crystal glassmorphism (`backdrop-blur-2xl`), traffic light window controls (🔴 🟡 🟢), SF Pro typography, smooth segmented controls, and animated iOS toggle switches.
- **Complete CLI Parameter Coverage**:
  - **Endpoint & Auth**: `--base-url`, `--api-key`, with real-time `/v1/models` ping & auto-discovery.
  - **Model & Tokenizer**: `--model`, `--served-model-name`, `--tokenizer`.
  - **Test Shapes**: Multi-token tag chips for `--pp` (prompt processing), `--tg` (generation), `--depth` (context depth sweep), `--concurrency` (parallel clients), and `--exact-tg`.
  - **Run Parameters**: `--runs`, `--warmup-runs`, `--no-warmup`.
  - **Latency & Prefix Caching**: `--latency-mode` (generation / api / none), `--enable-prefix-caching`, `--no-cache`, `--adapt-prompt`, `--skip-coherence`.
  - **Dataset & Text**: Project Gutenberg book source, `--book-url`.
  - **Output & Timeseries**: `--format` (md / json / csv), `--save-result`, `--save-total-throughput-timeseries`, `--save-all-throughput-timeseries`.
  - **Advanced Hooks**: `--post-run-cmd`, `--extra-body`, `--exit-on-first-fail`, `--no-results-on-fail`.
- **EvalScope Needle-In-A-Haystack**:
  - Full context retrieval accuracy testing across varying context lengths and depth percentages.
  - Interactive color-graded accuracy heatmaps, executive radar reports, and export capabilities.
  - ⚠️ **Note**: the in-app runner uses a **built-in lightweight NIAH engine** (string-match scoring, approximate token counts). For official results (real EvalScope corpus + LLM-judge scoring), use the generated Python script from the *Python Script & SDK* tab with `pip install "evalscope[needle_bench]"`.
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

## 🚀 Desktop Binaries & Web Quickstart

### Native Desktop App (Neutralinojs)
Download the standalone executable for your operating system directly from [Releases](https://github.com/ThanabordeeN/AI-Benchy/releases):
- **Linux**: `ai-benchy-linux-x64.tar.gz` / `ai-benchy-linux-arm64.tar.gz`
- **macOS**: `ai-benchy-mac-universal.tar.gz` (Apple Silicon & Intel)
- **Windows**: `ai-benchy-windows-x64.zip`

To build desktop binaries locally:
```bash
npm run neu:build
npm run neu:start
```

### Web Development
```bash
# 1. Install dependencies
npm install

# 2. Run Next.js dev server
npm run dev

# 3. Type check & build
npm run type-check
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔁 CI/CD & Branch Strategy

- **`dev` Branch**: Continuous integration for all active development.
  - On push to `dev`, the **Dev Pipeline** validates typecheck, runs Next.js build, compiles standalone desktop binaries, and uploads testing artifacts & rolling `dev-latest` pre-release.
- **`main` Branch**: Production releases.
  - Protected stable branch.
  - When a Pull Request is merged into `main`, the **Release on Main** workflow automatically builds multiplatform standalone binaries (Linux, macOS, Windows) and publishes a versioned GitHub Release with all release assets attached.
- **Pull Requests**:
  - Every PR targeting `dev` or `main` runs full automated validation via `CI` workflow.

---

## 🔧 Prerequisites for Real llama-benchy Execution

To run benchmarks directly against live inference backends, install `uv` (recommended):
```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or install llama-benchy directly
uv pip install -U git+https://github.com/eugr/llama-benchy
```

Alternatively, use the built-in **"Simulated Demo"** mode inside the UI to explore all analytics, charts, and table features instantly.
