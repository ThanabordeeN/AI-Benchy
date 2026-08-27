export type LatencyMode = 'generation' | 'api' | 'none';
export type OutputFormat = 'md' | 'json' | 'csv';

export interface BenchmarkConfig {
  // Required Endpoint & Auth
  baseUrl: string;
  apiKey: string;

  // Model & Tokenizer
  model: string;
  servedModelName: string;
  tokenizer: string;

  // Test Shapes
  pp: number[];       // Prompt Processing token counts, e.g. [2048]
  tg: number[];       // Token Generation token counts, e.g. [32]
  depth: number[];    // Context depth token counts, e.g. [0, 4096, 8192]
  exactTg: boolean;   // min_tokens=<tg> and ignore_eos=true

  // Run Controls
  runs: number;
  warmupRuns: number;
  noWarmup: boolean;
  concurrency: number[]; // e.g. [1]

  // Prompt Tuning & Latency
  latencyMode: LatencyMode;
  noAdaptPrompt: boolean;
  noCache: boolean;
  enablePrefixCaching: boolean;
  skipCoherence: boolean;

  // Dataset & Text Source
  gutenbergBookId?: number;
  bookUrl: string;
  datasetFile: string;

  // Output, Timeseries & Fail Behavior
  outputFormat: OutputFormat;
  saveResult: string;
  saveTotalThroughputTimeseries: boolean;
  saveAllThroughputTimeseries: boolean;
  sampleInterval: number;
  emitProgress: boolean;
  verbose: boolean;
  exitOnFirstFail: boolean;
  noResultsOnFail: boolean;

  // Advanced
  postRunCmd: string;
  extraBody: string;
}

export interface ProgressEvent {
  event: 'start' | 'warmup' | 'run_start' | 'run_progress' | 'run_complete' | 'live_metric' | 'coherence_check' | 'complete' | 'error' | 'stdout';
  timestamp: string;
  message?: string;
  currentTest?: string;
  testIndex?: number;
  totalTests?: number;
  runIndex?: number;
  totalRuns?: number;
  concurrency?: number;
  depth?: number;
  pp?: number;
  tg?: number;
  currentTps?: number;
  ttfrMs?: number;
  progressPercent?: number;
  liveRow?: BenchmarkResultRow;
  data?: any;
}

export interface BenchmarkResultRow {
  id: string;
  model: string;
  test: string;
  pp: number;
  tg: number;
  depth: number;
  concurrency: number;
  tps: number;
  tpsStd?: number;
  peakTps?: number;
  peakTpsStd?: number;
  ttfrMs?: number;
  ttfrStd?: number;
  estPptMs?: number;
  estPptStd?: number;
  e2eTtftMs?: number;
  e2eTtftStd?: number;
  rawText?: string;
}

export interface ThroughputDataPoint {
  time: number;
  totalThroughput: number;
  requestThroughput?: number[];
  depth?: number;
  concurrency?: number;
}

export interface BenchmarkSession {
  id: string;
  createdAt: string;
  config: BenchmarkConfig;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  rows: BenchmarkResultRow[];
  timeseries: ThroughputDataPoint[];
  stdoutLogs: string[];
  rawMarkdown?: string;
  durationMs?: number;
  summary?: {
    avgPpTps: number;
    avgTgTps: number;
    avgTtfrMs: number;
    peakTps: number;
    totalTokens: number;
  };
}

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  badge: string;
  icon: string;
  config: Partial<BenchmarkConfig>;
}
