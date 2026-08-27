'use client';

import React from 'react';
import { GlassCard } from '@/components/apple/GlassCard';
import { EvalScopeConfig } from '@/types/evalscope';
import {
  Sliders,
  Target,
  FileQuestion,
  Key,
  Layers,
  Cpu,
  Zap,
  Globe,
  Plus,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NeedleConfigPanelProps {
  config: EvalScopeConfig;
  onChange: (config: EvalScopeConfig) => void;
}

export const NeedleConfigPanel: React.FC<NeedleConfigPanelProps> = ({ config, onChange }) => {
  const updateDatasetArgs = (key: string, value: any) => {
    onChange({
      ...config,
      datasetArgs: {
        ...config.datasetArgs,
        [key]: value,
      },
    });
  };

  const updateGenerationConfig = (key: string, value: any) => {
    onChange({
      ...config,
      generationConfig: {
        ...config.generationConfig,
        [key]: value,
      },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Context Length Range */}
        <GlassCard
          title="Context Window Range (Tokens)"
          subtitle="Configure start length, maximum context (up to 200k+), and intervals"
          icon={<Layers className="w-4 h-4 text-apple-blue" />}
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Min Context (Tokens)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={config.datasetArgs.contextLengthsMin}
                  onChange={(e) => updateDatasetArgs('contextLengthsMin', Number(e.target.value))}
                  className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Max Context (Tokens)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={config.datasetArgs.contextLengthsMax}
                  onChange={(e) => updateDatasetArgs('contextLengthsMax', Number(e.target.value))}
                  className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue font-bold text-apple-blue"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Intervals
                </label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={config.datasetArgs.contextLengthsNumIntervals}
                  onChange={(e) => updateDatasetArgs('contextLengthsNumIntervals', Number(e.target.value))}
                  className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>
            </div>

            {/* Quick Context Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-black/5 dark:border-white/5">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">Quick Max Presets:</span>
              {[
                { label: '32K', val: 32000 },
                { label: '64K', val: 64000 },
                { label: '128K (Official)', val: 128000 },
                { label: '200K (Recommended)', val: 200000 },
                { label: '500K', val: 500000 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => updateDatasetArgs('contextLengthsMax', p.val)}
                  className={clsx(
                    'px-2 py-0.5 rounded-md text-[11px] font-mono transition',
                    config.datasetArgs.contextLengthsMax === p.val
                      ? 'bg-apple-blue text-white font-bold'
                      : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-black/10'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Card 2: Needle Depth & Intervals */}
        <GlassCard
          title="Needle Depth Range (%)"
          subtitle="Positions inside document to hide the needle (from 0% beginning to 100% end)"
          icon={<Target className="w-4 h-4 text-emerald-500" />}
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Min Depth (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.datasetArgs.documentDepthPercentMin}
                  onChange={(e) => updateDatasetArgs('documentDepthPercentMin', Number(e.target.value))}
                  className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Max Depth (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.datasetArgs.documentDepthPercentMax}
                  onChange={(e) => updateDatasetArgs('documentDepthPercentMax', Number(e.target.value))}
                  className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue font-bold text-emerald-600"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Intervals
                </label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={config.datasetArgs.documentDepthPercentIntervals}
                  onChange={(e) => updateDatasetArgs('documentDepthPercentIntervals', Number(e.target.value))}
                  className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-black/5 dark:border-white/5">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">Depth Presets:</span>
              {[
                { label: '10 Intervals (0–100%)', val: 10 },
                { label: '5 Intervals (0–100%)', val: 5 },
                { label: '20 Intervals (Granular)', val: 20 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => updateDatasetArgs('documentDepthPercentIntervals', p.val)}
                  className={clsx(
                    'px-2 py-0.5 rounded-md text-[11px] font-mono transition',
                    config.datasetArgs.documentDepthPercentIntervals === p.val
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-black/10'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Card 3: Retrieval Question & Needles */}
      <GlassCard
        title="Needle & Retrieval Question Editor"
        subtitle="Specify target secret needle facts embedded into the context and the test question"
        icon={<FileQuestion className="w-4 h-4 text-purple-500" />}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Retrieval Question
            </label>
            <input
              type="text"
              value={config.datasetArgs.retrievalQuestion}
              onChange={(e) => updateDatasetArgs('retrievalQuestion', e.target.value)}
              placeholder="e.g. What is the secret verification code?"
              className="h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Target Needle(s)
              </label>
              <span className="text-[10px] text-zinc-400">
                Single or Multi-Needle testing
              </span>
            </div>

            {config.datasetArgs.needles.map((needle, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={needle}
                  onChange={(e) => {
                    const newNeedles = [...config.datasetArgs.needles];
                    newNeedles[idx] = e.target.value;
                    updateDatasetArgs('needles', newNeedles);
                  }}
                  className="flex-1 h-10 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue font-semibold text-emerald-600 dark:text-emerald-400"
                />
                {config.datasetArgs.needles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newNeedles = config.datasetArgs.needles.filter((_, i) => i !== idx);
                      updateDatasetArgs('needles', newNeedles);
                    }}
                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Tokenizer & Model Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-black/5 dark:border-white/5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                Tokenizer Path (HF)
              </label>
              <input
                type="text"
                value={config.datasetArgs.tokenizerPath}
                onChange={(e) => updateDatasetArgs('tokenizerPath', e.target.value)}
                placeholder="Qwen/Qwen3-0.6B"
                className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                Max Gen Tokens
              </label>
              <input
                type="number"
                value={config.generationConfig.maxTokens}
                onChange={(e) => updateGenerationConfig('maxTokens', Number(e.target.value))}
                className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                Temperature
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={config.generationConfig.temperature}
                onChange={(e) => updateGenerationConfig('temperature', Number(e.target.value))}
                className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
