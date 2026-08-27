export interface NeedleDatasetArgs {
  subsetList: string[];
  retrievalQuestion: string;
  needles: string[];
  contextLengthsMin: number;
  contextLengthsMax: number;
  contextLengthsNumIntervals: number;
  documentDepthPercentMin: number;
  documentDepthPercentMax: number;
  documentDepthPercentIntervals: number;
  tokenizerPath: string;
  showScore: boolean;
}

export interface EvalScopeConfig {
  model: string;
  apiUrl: string;
  apiKey: string;
  evalType: string;
  datasets: string[];
  datasetArgs: NeedleDatasetArgs;
  generationConfig: {
    maxTokens: number;
    temperature: number;
  };
  evalBatchSize: number;
}

export interface HeatmapCell {
  contextLength: number;
  depthPercent: number;
  score: number; // 0.0 to 1.0 (1.0 = passed, 0.5 = partial, 0.0 = failed)
  status: 'passed' | 'partial' | 'failed' | 'running' | 'pending';
  responseSnippet?: string;
  needleFound?: boolean;
  latencyMs?: number;
}

export interface NeedleEvalProgressEvent {
  event: 'start' | 'cell_start' | 'cell_complete' | 'complete' | 'error' | 'stdout';
  timestamp: string;
  message?: string;
  currentCell?: {
    contextLength: number;
    depthPercent: number;
  };
  cellResult?: HeatmapCell;
  progressPercent?: number;
  completedCells?: number;
  totalCells?: number;
}

export interface NeedleEvalSession {
  id: string;
  createdAt: string;
  config: EvalScopeConfig;
  status: 'idle' | 'running' | 'completed' | 'failed';
  cells: HeatmapCell[];
  averageScore: number;
  totalTested: number;
  passedCount: number;
  rawLogs: string[];
  reportMarkdown?: string;
}
