import { PresetTemplate, BenchmarkConfig } from '@/types/benchmark';

export function detectHfTokenizerFromModelName(name: string): string {
  if (!name) return 'Qwen/Qwen2.5-32B-Instruct';
  const lower = name.toLowerCase();

  // If already a valid HF namespace/repo format (e.g. meta-llama/Llama-3.1-8B)
  if (name.includes('/') && !name.startsWith('/') && !name.includes('\\') && !name.endsWith('.gguf')) {
    return name;
  }

  if (
    lower.includes('qwen3.8') ||
    lower.includes('qwen-3.8') ||
    lower.includes('qwen3.6') ||
    lower.includes('qwen3.5') ||
    lower.includes('qwen3') ||
    lower.includes('qwen2.5') ||
    lower.includes('qwen')
  ) {
    if (lower.includes('32b') || lower.includes('27b') || lower.includes('35b')) {
      return 'Qwen/Qwen2.5-32B-Instruct';
    }
    if (lower.includes('14b')) {
      return 'Qwen/Qwen2.5-14B-Instruct';
    }
    if (
      lower.includes('0.5b') ||
      lower.includes('0.6b') ||
      lower.includes('0.8b') ||
      lower.includes('1.5b') ||
      lower.includes('3b') ||
      lower.includes('7b')
    ) {
      return 'Qwen/Qwen2.5-7B-Instruct';
    }
    return 'Qwen/Qwen2.5-32B-Instruct';
  }

  if (lower.includes('phi-3') || lower.includes('phi-4') || lower.includes('phibek') || lower.includes('phi')) {
    return 'microsoft/Phi-3-mini-4k-instruct';
  }

  if (
    lower.includes('llama-3.3') ||
    lower.includes('llama-3.2') ||
    lower.includes('llama-3.1') ||
    lower.includes('llama3') ||
    lower.includes('llama')
  ) {
    if (lower.includes('70b')) return 'meta-llama/Llama-3.1-70B-Instruct';
    return 'meta-llama/Llama-3.1-8B-Instruct';
  }

  if (lower.includes('deepseek-r1') || lower.includes('deepseek') || lower.includes('r1')) {
    return 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B';
  }

  if (lower.includes('mistral') || lower.includes('mixtral')) {
    return 'mistralai/Mistral-7B-Instruct-v0.3';
  }

  if (lower.includes('gemma-2') || lower.includes('gemma')) {
    return 'google/gemma-2-9b-it';
  }

  return 'Qwen/Qwen2.5-32B-Instruct';
}

export const DEFAULT_CONFIG: BenchmarkConfig = {
  baseUrl: 'http://localhost:1234/v1',
  apiKey: 'EMPTY',
  model: 'Qwen/Qwen2.5-32B-Instruct',
  servedModelName: '',
  tokenizer: '',
  pp: [512],
  tg: [128],
  depth: [0],
  exactTg: false,
  runs: 3,
  warmupRuns: 1,
  noWarmup: false,
  concurrency: [1],
  latencyMode: 'generation',
  noAdaptPrompt: false,
  noCache: false,
  enablePrefixCaching: false,
  skipCoherence: true, // Default to true to prevent hangs on reasoning models (<think>)
  bookUrl: '',
  datasetFile: '',
  outputFormat: 'md',
  saveResult: '',
  saveTotalThroughputTimeseries: true,
  saveAllThroughputTimeseries: false,
  sampleInterval: 1.0,
  emitProgress: true,
  verbose: false,
  exitOnFirstFail: false,
  noResultsOnFail: false,
  postRunCmd: '',
  extraBody: '',
};

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'quick-smoke',
    name: 'Quick Smoke Test',
    description: 'Fast single-run test to verify endpoint connectivity, prompt processing and generation speeds.',
    badge: 'Fast (30s)',
    icon: 'Zap',
    config: {
      pp: [512, 1024],
      tg: [32],
      depth: [0],
      runs: 1,
      warmupRuns: 1,
      concurrency: [1],
      latencyMode: 'generation',
      skipCoherence: true,
    },
  },
  {
    id: 'standard-bench',
    name: 'Standard Evaluation',
    description: 'Official llama-bench style test across 512–2048 prompt tokens with 3 runs mean ± std calculation.',
    badge: 'Standard',
    icon: 'Gauge',
    config: {
      pp: [512],
      tg: [128],
      depth: [0],
      runs: 3,
      warmupRuns: 1,
      concurrency: [1],
      latencyMode: 'generation',
      skipCoherence: true,
    },
  },
  {
    id: 'deep-context-sweep',
    name: 'Deep Context Scaling',
    description: 'Measures prefill and generation degradation as context window grows from 0 to 32k tokens.',
    badge: 'Context Scaling',
    icon: 'Layers',
    config: {
      pp: [2048],
      tg: [32],
      depth: [0, 4096, 8192, 16384, 32768],
      runs: 3,
      warmupRuns: 1,
      concurrency: [1],
      latencyMode: 'generation',
      skipCoherence: true,
    },
  },
  {
    id: 'concurrency-stress',
    name: 'Concurrency & Throughput',
    description: 'Tests multi-client serving throughput scaling across concurrency levels 1, 2, 4, 8, 16.',
    badge: 'Stress Test',
    icon: 'Users',
    config: {
      pp: [1024],
      tg: [64],
      depth: [0],
      runs: 2,
      warmupRuns: 1,
      concurrency: [1, 2, 4, 8, 16],
      saveTotalThroughputTimeseries: true,
      latencyMode: 'generation',
      skipCoherence: true,
    },
  },
  {
    id: 'prefix-cache-eval',
    name: 'Prefix Cache Performance',
    description: 'Evaluates TTFT acceleration when KV cache is prefilled and reused across requests.',
    badge: 'KV Cache',
    icon: 'Cpu',
    config: {
      pp: [2048],
      tg: [32],
      depth: [0],
      enablePrefixCaching: true,
      runs: 3,
      warmupRuns: 1,
      concurrency: [1],
      latencyMode: 'generation',
      skipCoherence: true,
    },
  },
  {
    id: 'fixed-length-osl',
    name: 'Fixed OSL Throughput',
    description: 'Forces exact generation length with min_tokens and ignore_eos for strict benchmarking.',
    badge: 'Fixed Length',
    icon: 'Activity',
    config: {
      pp: [1024],
      tg: [128],
      exactTg: true,
      depth: [0],
      runs: 3,
      warmupRuns: 1,
      concurrency: [1],
      latencyMode: 'generation',
      skipCoherence: true,
    },
  },
];
