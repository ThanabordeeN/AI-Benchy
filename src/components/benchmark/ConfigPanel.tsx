'use client';

import React, { useState } from 'react';
import { BenchmarkConfig } from '@/types/benchmark';
import { TagInput } from '@/components/apple/TagInput';
import { Stepper } from '@/components/apple/Stepper';
import { Switch } from '@/components/apple/Switch';
import { SegmentedControl } from '@/components/apple/SegmentedControl';
import { GlassCard } from '@/components/apple/GlassCard';
import {
  Layers,
  Cpu,
  Zap,
  BookOpen,
  Sliders,
  Settings,
  Terminal,
  HelpCircle,
  Clock,
  HardDrive,
  CheckCircle2,
  FileCode,
} from 'lucide-react';
import { clsx } from 'clsx';

interface ConfigPanelProps {
  config: BenchmarkConfig;
  onChange: (newConfig: BenchmarkConfig) => void;
}

type TabType = 'shapes' | 'model' | 'latency' | 'dataset' | 'output' | 'advanced';

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
  const [activeTab, setActiveTab] = useState<TabType>('shapes');

  const updateConfig = <K extends keyof BenchmarkConfig>(key: K, value: BenchmarkConfig[K]) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Segmented Tabs */}
      <div className="flex items-center justify-between overflow-x-auto pb-1">
        <SegmentedControl<TabType>
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { id: 'shapes', label: 'Test Shapes & Concurrency', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'model', label: 'Model & Tokenizer', icon: <Cpu className="w-3.5 h-3.5" /> },
            { id: 'latency', label: 'Latency & Cache', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'dataset', label: 'Dataset & Text', icon: <BookOpen className="w-3.5 h-3.5" /> },
            { id: 'output', label: 'Output & Timeseries', icon: <HardDrive className="w-3.5 h-3.5" /> },
            { id: 'advanced', label: 'Advanced & Hooks', icon: <Sliders className="w-3.5 h-3.5" /> },
          ]}
        />
      </div>

      {/* Tab 1: Test Shapes & Concurrency */}
      {activeTab === 'shapes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
          {/* Prompt Processing */}
          <GlassCard
            title="Prompt Processing (PP)"
            subtitle="Input sequence lengths to benchmark prefill throughput"
            icon={<Layers className="w-4 h-4" />}
          >
            <TagInput
              label="Prompt Token Counts"
              sublabel="Test prefill speed for each prompt length"
              flagName="--pp"
              values={config.pp}
              onChange={(vals) => updateConfig('pp', vals)}
              quickSuggestions={[512, 1024, 2048, 4096, 8192, 16384]}
              unit=" tokens"
            />
          </GlassCard>

          {/* Token Generation */}
          <GlassCard
            title="Token Generation (TG)"
            subtitle="Output tokens to generate for autoregressive decoding speed"
            icon={<Zap className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-4">
              <TagInput
                label="Generation Token Counts"
                sublabel="Number of tokens to generate per test"
                flagName="--tg"
                values={config.tg}
                onChange={(vals) => updateConfig('tg', vals)}
                quickSuggestions={[16, 32, 64, 128, 256, 512]}
                unit=" tokens"
              />

              <div className="pt-3 border-t border-black/5 dark:border-white/5">
                <Switch
                  checked={config.exactTg}
                  onChange={(checked) => updateConfig('exactTg', checked)}
                  label="Force Exact Generation Length (--exact-tg)"
                  description="Sends min_tokens=<tg> and ignore_eos=true for strict fixed-OSL runs"
                />
              </div>
            </div>
          </GlassCard>

          {/* Context Depth */}
          <GlassCard
            title="Context Depth Sweep"
            subtitle="Simulates previous conversation history / KV cache depth"
            icon={<Clock className="w-4 h-4" />}
          >
            <TagInput
              label="Context Depths (Tokens)"
              sublabel="Evaluate speed degradation as context window grows"
              flagName="--depth"
              values={config.depth}
              onChange={(vals) => updateConfig('depth', vals)}
              quickSuggestions={[0, 2048, 4096, 8192, 16384, 32768, 65536]}
              unit=" tokens"
            />
          </GlassCard>

          {/* Concurrency & Runs */}
          <GlassCard
            title="Concurrency & Iteration Runs"
            subtitle="Configure parallel client loads and statistical sample count"
            icon={<Sliders className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-4">
              <TagInput
                label="Concurrency Levels"
                sublabel="Simultaneous parallel requests to stress server"
                flagName="--concurrency"
                values={config.concurrency}
                onChange={(vals) => updateConfig('concurrency', vals)}
                quickSuggestions={[1, 2, 4, 8, 16, 32]}
                unit=" clients"
              />

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/5 dark:border-white/5">
                <Stepper
                  label="Benchmark Runs"
                  flagName="--runs"
                  value={config.runs}
                  min={1}
                  max={20}
                  onChange={(val) => updateConfig('runs', val)}
                  quickOptions={[1, 3, 5]}
                />

                <Stepper
                  label="Warmup Runs"
                  flagName="--warmup-runs"
                  value={config.warmupRuns}
                  min={0}
                  max={10}
                  onChange={(val) => updateConfig('warmupRuns', val)}
                  quickOptions={[0, 1, 2]}
                />
              </div>

              <div className="pt-2">
                <Switch
                  checked={config.noWarmup}
                  onChange={(checked) => updateConfig('noWarmup', checked)}
                  label="Skip Warmup Phase (--no-warmup)"
                  description="Execute test shapes immediately without priming KV cache"
                  size="sm"
                />
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab 2: Model & Tokenizer */}
      {activeTab === 'model' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
          {/* Model Selection */}
          <GlassCard
            title="Model Name Configuration"
            subtitle="Target model identifier passed to endpoint"
            icon={<Cpu className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>Model Identifier</span>
                  <code className="text-[10px] font-mono text-apple-blue dark:text-apple-cyan bg-apple-blue/10 px-1.5 py-0.2 rounded">
                    --model
                  </code>
                </label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => updateConfig('model', e.target.value)}
                  placeholder="e.g. meta-llama/Llama-3.1-8B-Instruct (auto-detected if empty)"
                  className="w-full h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue shadow-apple-sm transition"
                />
                <p className="text-[11px] text-zinc-500">
                  If left blank, llama-benchy attempts auto-detection via the endpoint's <code>/models</code> API.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 pt-3 border-t border-black/5 dark:border-white/5">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>Served Model Name in API Calls</span>
                  <code className="text-[10px] font-mono text-zinc-500 bg-black/5 dark:bg-white/10 px-1.5 py-0.2 rounded">
                    --served-model-name
                  </code>
                </label>
                <input
                  type="text"
                  value={config.servedModelName}
                  onChange={(e) => updateConfig('servedModelName', e.target.value)}
                  placeholder="Defaults to --model if not specified"
                  className="w-full h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue shadow-apple-sm transition"
                />
              </div>
            </div>
          </GlassCard>

          {/* Tokenizer */}
          <GlassCard
            title="HuggingFace Tokenizer"
            subtitle="Used for precise token count calculations and chat templates"
            icon={<FileCode className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>Tokenizer Repo or Local Path</span>
                  <code className="text-[10px] font-mono text-apple-blue dark:text-apple-cyan bg-apple-blue/10 px-1.5 py-0.2 rounded">
                    --tokenizer
                  </code>
                </label>
                <input
                  type="text"
                  value={config.tokenizer}
                  onChange={(e) => updateConfig('tokenizer', e.target.value)}
                  placeholder="Defaults to model name (e.g. meta-llama/Meta-Llama-3.1-8B)"
                  className="w-full h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue shadow-apple-sm transition"
                />
                <p className="text-[11px] text-zinc-500">
                  Can be a HuggingFace hub model ID or local directory containing <code>tokenizer.json</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-apple-blue/5 dark:bg-apple-blue/10 border border-apple-blue/20 text-xs text-zinc-700 dark:text-zinc-300">
                <p className="font-semibold text-apple-blue mb-1">Tokenizer Best Practice</p>
                <p className="text-[11px] leading-relaxed">
                  Accurate token counts ensure prompt lengths match target <code>--pp</code> and <code>--depth</code> specifications without chat template token drift.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab 3: Latency & Cache */}
      {activeTab === 'latency' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
          {/* Latency Mode */}
          <GlassCard
            title="Latency Measurement Mode"
            subtitle="Methodology for calculating TTFR, TTFT and Prompt Processing Speed"
            icon={<Clock className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>Latency Mode</span>
                  <code className="text-[10px] font-mono text-apple-blue dark:text-apple-cyan bg-apple-blue/10 px-1.5 py-0.2 rounded">
                    --latency-mode
                  </code>
                </label>
                <SegmentedControl<BenchmarkConfig['latencyMode']>
                  value={config.latencyMode}
                  onChange={(val) => updateConfig('latencyMode', val)}
                  fullWidth
                  options={[
                    { id: 'generation', label: 'Generation (Recommended)' },
                    { id: 'api', label: 'API (Models ping)' },
                    { id: 'none', label: 'None' },
                  ]}
                />
              </div>

              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 space-y-1.5">
                <p>
                  <strong className="text-zinc-800 dark:text-zinc-200">generation mode:</strong> Runs a single-token probe to measure pure generation overhead, allowing estimated prompt processing time (est_ppt) and prompt processing speed (pp t/s) to be computed accurately even on short prompts.
                </p>
                <p>
                  <strong className="text-zinc-800 dark:text-zinc-200">api mode:</strong> Measures latency via a standard <code>GET /models</code> request.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Caching & Prompt Tuning */}
          <GlassCard
            title="Prefix Caching & Coherence"
            subtitle="Tuning cache behavior and post-warmup verification"
            icon={<Zap className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-4">
              <Switch
                checked={config.enablePrefixCaching}
                onChange={(checked) => updateConfig('enablePrefixCaching', checked)}
                label="Enable Prefix Caching (--enable-prefix-caching)"
                description="Measures speedup when prompt shares prefilled context in server KV cache"
              />

              <div className="border-t border-black/5 dark:border-white/5 pt-3">
                <Switch
                  checked={config.noCache}
                  onChange={(checked) => updateConfig('noCache', checked)}
                  label="Avoid Cache Hits (--no-cache)"
                  description="Adds unique random prefix noise and sets cache_prompt=false"
                />
              </div>

              <div className="border-t border-black/5 dark:border-white/5 pt-3">
                <Switch
                  checked={!config.noAdaptPrompt}
                  onChange={(checked) => updateConfig('noAdaptPrompt', !checked)}
                  label="Adapt Prompt Size (--adapt-prompt)"
                  description="Adapts prompt tokens based on warmup delta so exact target --pp is met"
                />
              </div>

              <div className="border-t border-black/5 dark:border-white/5 pt-3">
                <Switch
                  checked={config.skipCoherence}
                  onChange={(checked) => updateConfig('skipCoherence', checked)}
                  label="Skip Coherence Test (--skip-coherence)"
                  description="Bypass the post-warmup sanity check verifying the model responds meaningfully"
                />
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab 4: Dataset & Text */}
      {activeTab === 'dataset' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
          {/* Gutenberg Book Source */}
          <GlassCard
            title="Project Gutenberg Text Source"
            subtitle="Realistic natural language source for prompt and context generation"
            icon={<BookOpen className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>Custom Book URL</span>
                  <code className="text-[10px] font-mono text-apple-blue dark:text-apple-cyan bg-apple-blue/10 px-1.5 py-0.2 rounded">
                    --book-url
                  </code>
                </label>
                <input
                  type="text"
                  value={config.bookUrl}
                  onChange={(e) => updateConfig('bookUrl', e.target.value)}
                  placeholder="Defaults to Project Gutenberg (Sherlock Holmes / Moby Dick)"
                  className="w-full h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue shadow-apple-sm transition"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Why realistic natural language text?
                </p>
                <p className="text-[11px] leading-relaxed">
                  Random tokens fail to test Speculative Decoding, Multi-Token Prediction (MTP), and ngram draft models realistically. Gutenberg book text ensures accurate entropy and acceptance rates.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Custom Dataset File */}
          <GlassCard
            title="Custom Local Dataset File"
            subtitle="Provide your own benchmark text dataset from filesystem"
            icon={<FileCode className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>Dataset File Path (Plain Text)</span>
                  <code className="text-[10px] font-mono text-apple-blue dark:text-apple-cyan bg-apple-blue/10 px-1.5 py-0.2 rounded">
                    --dataset-file
                  </code>
                </label>
                <input
                  type="text"
                  value={config.datasetFile}
                  onChange={(e) => updateConfig('datasetFile', e.target.value)}
                  placeholder="/path/to/my-custom-prompts.txt"
                  className="w-full h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue shadow-apple-sm transition"
                />
              </div>

              <p className="text-[11px] text-zinc-500">
                When provided, llama-benchy extracts slices of this text for prompt prefill and context generation instead of downloading online books.
              </p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab 5: Output & Timeseries */}
      {activeTab === 'output' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
          {/* Format & File Saving */}
          <GlassCard
            title="Output Format & Result File"
            subtitle="Choose stdout display format and disk persistence"
            icon={<HardDrive className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>Output Format</span>
                  <code className="text-[10px] font-mono text-apple-blue dark:text-apple-cyan bg-apple-blue/10 px-1.5 py-0.2 rounded">
                    --format
                  </code>
                </label>
                <SegmentedControl<BenchmarkConfig['outputFormat']>
                  value={config.outputFormat}
                  onChange={(val) => updateConfig('outputFormat', val)}
                  fullWidth
                  options={[
                    { id: 'md', label: 'Markdown Table' },
                    { id: 'json', label: 'JSON' },
                    { id: 'csv', label: 'CSV' },
                  ]}
                />
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>Save Result File Path</span>
                  <code className="text-[10px] font-mono text-apple-blue dark:text-apple-cyan bg-apple-blue/10 px-1.5 py-0.2 rounded">
                    --save-result
                  </code>
                </label>
                <input
                  type="text"
                  value={config.saveResult}
                  onChange={(e) => updateConfig('saveResult', e.target.value)}
                  placeholder="results/benchmark_run.json"
                  className="w-full h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue shadow-apple-sm transition"
                />
              </div>
            </div>
          </GlassCard>

          {/* Granular Timeseries */}
          <GlassCard
            title="Granular Throughput Timeseries"
            subtitle="Capture 1-second interval time-series for peak calculations and charts"
            icon={<Clock className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-4">
              <Switch
                checked={config.saveTotalThroughputTimeseries}
                onChange={(checked) => updateConfig('saveTotalThroughputTimeseries', checked)}
                label="Save Total Throughput Timeseries (--save-total-throughput-timeseries)"
                description="Records aggregate tokens/sec across each sampling window"
              />

              <div className="border-t border-black/5 dark:border-white/5 pt-3">
                <Switch
                  checked={config.saveAllThroughputTimeseries}
                  onChange={(checked) => updateConfig('saveAllThroughputTimeseries', checked)}
                  label="Save Per-Request Timeseries (--save-all-throughput-timeseries)"
                  description="Records individual request throughput streams"
                />
              </div>

              <div className="border-t border-black/5 dark:border-white/5 pt-3">
                <Stepper
                  label="Sample Interval"
                  sublabel="Sampling frequency for throughput calculations"
                  flagName="--sample-interval"
                  value={config.sampleInterval}
                  min={0.1}
                  max={5.0}
                  step={0.5}
                  unit="s"
                  onChange={(val) => updateConfig('sampleInterval', val)}
                  quickOptions={[0.5, 1.0, 2.0]}
                />
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab 6: Advanced & Hooks */}
      {activeTab === 'advanced' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
          {/* Post Run Hook & Extra Body */}
          <GlassCard
            title="Execution Hooks & Request Modifiers"
            subtitle="Custom lifecycle triggers and request body overrides"
            icon={<Sliders className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>Post-Run Command Hook</span>
                  <code className="text-[10px] font-mono text-apple-blue dark:text-apple-cyan bg-apple-blue/10 px-1.5 py-0.2 rounded">
                    --post-run-cmd
                  </code>
                </label>
                <input
                  type="text"
                  value={config.postRunCmd}
                  onChange={(e) => updateConfig('postRunCmd', e.target.value)}
                  placeholder='e.g. "curl http://localhost:8000/reset_cache"'
                  className="w-full h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue shadow-apple-sm transition"
                />
                <p className="text-[11px] text-zinc-500">
                  Command executed in shell after each run (useful to clear VRAM or reset server state).
                </p>
              </div>

              <div className="flex flex-col gap-1.5 pt-3 border-t border-black/5 dark:border-white/5">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>Extra JSON Body Payload</span>
                  <code className="text-[10px] font-mono text-apple-blue dark:text-apple-cyan bg-apple-blue/10 px-1.5 py-0.2 rounded">
                    --extra-body
                  </code>
                </label>
                <input
                  type="text"
                  value={config.extraBody}
                  onChange={(e) => updateConfig('extraBody', e.target.value)}
                  placeholder='e.g. "temperature=0.0,top_p=0.9" or "{\"guided_json\": {}}"'
                  className="w-full h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue shadow-apple-sm transition"
                />
              </div>
            </div>
          </GlassCard>

          {/* Fault Tolerance & Verbose */}
          <GlassCard
            title="Fault Tolerance & Debugging"
            subtitle="Error handling strategy during multi-shape benchmark runs"
            icon={<HelpCircle className="w-4 h-4" />}
          >
            <div className="flex flex-col gap-4">
              <Switch
                checked={config.exitOnFirstFail}
                onChange={(checked) => updateConfig('exitOnFirstFail', checked)}
                label="Exit on First Fail (--exit-on-first-fail)"
                description="Immediately terminate the entire suite if any request encounters an error"
              />

              <div className="border-t border-black/5 dark:border-white/5 pt-3">
                <Switch
                  checked={config.noResultsOnFail}
                  onChange={(checked) => updateConfig('noResultsOnFail', checked)}
                  label="No Results on Fail (--no-results-on-fail)"
                  description="Prevent saving/printing partial results when an error occurs"
                />
              </div>

              <div className="border-t border-black/5 dark:border-white/5 pt-3">
                <Switch
                  checked={config.verbose}
                  onChange={(checked) => updateConfig('verbose', checked)}
                  label="Verbose Logging (--verbose)"
                  description="Output detailed HTTP debug info and request roundtrip traces"
                />
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
