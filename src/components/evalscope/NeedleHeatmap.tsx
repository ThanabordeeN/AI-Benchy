'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/apple/GlassCard';
import { EvalScopeConfig, HeatmapCell } from '@/types/evalscope';
import { computeContextLengths, computeDepthPercents } from '@/utils/evalscope';
import {
  Grid,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Info,
  Layers,
  Target,
  FileText,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NeedleHeatmapProps {
  config: EvalScopeConfig;
  cells: HeatmapCell[];
  isRunning?: boolean;
  onOpenReport?: () => void;
}

export const NeedleHeatmap: React.FC<NeedleHeatmapProps> = ({
  config,
  cells,
  isRunning = false,
  onOpenReport,
}) => {
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

  const contextLengths = computeContextLengths(
    config.datasetArgs.contextLengthsMin,
    config.datasetArgs.contextLengthsMax,
    config.datasetArgs.contextLengthsNumIntervals
  );

  const depths = computeDepthPercents(
    config.datasetArgs.documentDepthPercentMin,
    config.datasetArgs.documentDepthPercentMax,
    config.datasetArgs.documentDepthPercentIntervals
  );

  const totalCells = contextLengths.length * depths.length;
  const passedCells = cells.filter((c) => c.status === 'passed').length;
  const partialCells = cells.filter((c) => c.status === 'partial').length;
  const failedCells = cells.filter((c) => c.status === 'failed').length;
  const completedCells = cells.filter((c) => c.status !== 'pending' && c.status !== 'running').length;
  const passRate = completedCells > 0 ? ((passedCells / completedCells) * 100).toFixed(1) : '—';

  // Find degradation point (first context length with < 80% pass rate)
  let degradationContext: number | null = null;
  for (const ctx of contextLengths) {
    const ctxCells = cells.filter((c) => c.contextLength === ctx && c.status !== 'pending');
    if (ctxCells.length > 0) {
      const ctxPass = ctxCells.filter((c) => c.status === 'passed').length;
      if (ctxPass / ctxCells.length < 0.8) {
        degradationContext = ctx;
        break;
      }
    }
  }

  const getCellBg = (cell?: HeatmapCell) => {
    if (!cell || cell.status === 'pending') {
      return 'bg-black/[0.03] dark:bg-white/[0.04] border-black/5 dark:border-white/10 text-zinc-400';
    }
    if (cell.status === 'running') {
      return 'bg-apple-blue/20 border-apple-blue text-apple-blue animate-pulse';
    }
    if (cell.score >= 0.95) {
      return 'bg-emerald-500/85 hover:bg-emerald-500 text-white border-emerald-600 shadow-sm';
    }
    if (cell.score >= 0.5) {
      return 'bg-amber-500/85 hover:bg-amber-500 text-white border-amber-600 shadow-sm';
    }
    return 'bg-rose-500/85 hover:bg-rose-500 text-white border-rose-600 shadow-sm';
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* 1. Accuracy Summary HUD Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 shadow-apple-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Retrieval Pass Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {passRate !== '—' ? `${passRate}%` : '—'}
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {passedCells} of {completedCells || totalCells} tested cells passed
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 shadow-apple-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Context Boundary
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-purple-600 dark:text-purple-400 tracking-tight">
              {degradationContext ? `${Math.round(degradationContext / 1000)}K` : '200K+'}
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {degradationContext ? 'Retrieval starts degrading here' : 'Max evaluated length'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 shadow-apple-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Evaluated Matrix
            </span>
            <div className="w-7 h-7 rounded-lg bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-apple-blue tracking-tight">
              {completedCells}/{totalCells}
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {contextLengths.length} Contexts × {depths.length} Depths
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 shadow-apple-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Partial / Failed
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              <span className="text-amber-500">{partialCells}</span> / <span className="text-rose-500">{failedCells}</span>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Attention blindspots detected
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Heatmap Matrix Grid */}
      <GlassCard
        title="Needle In A Haystack (NIAH) Heatmap"
        subtitle={`Retrieval accuracy across ${contextLengths[0] >= 1000 ? `${Math.round(contextLengths[0] / 1000)}K` : contextLengths[0]} to ${Math.round(contextLengths[contextLengths.length - 1] / 1000)}K tokens context & 0–100% needle depth`}
        icon={<Grid className="w-4 h-4 text-apple-blue" />}
        headerAction={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> 100% Pass
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Partial
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Failed
              </span>
            </div>

            {onOpenReport && (
              <button
                type="button"
                onClick={onOpenReport}
                className="px-3 py-1 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>NIAH Report (.md)</span>
              </button>
            )}
          </div>
        }
      >
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[640px] flex flex-col gap-2">
            {/* Column Header: Needle Depth % */}
            <div className="grid items-center gap-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 font-semibold"
                 style={{ gridTemplateColumns: `80px repeat(${depths.length}, minmax(40px, 1fr))` }}>
              <span className="text-right pr-2">Context</span>
              {depths.map((d) => (
                <span key={d} className="text-center">
                  {d}%
                </span>
              ))}
            </div>

            {/* Matrix Rows */}
            {contextLengths.map((ctx) => {
              const ctxLabel = ctx >= 1000 ? `${Math.round(ctx / 1000)}K` : `${ctx}`;
              return (
                <div
                  key={ctx}
                  className="grid items-center gap-1"
                  style={{ gridTemplateColumns: `80px repeat(${depths.length}, minmax(40px, 1fr))` }}
                >
                  <span className="text-right pr-2 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {ctxLabel}
                  </span>

                  {depths.map((depth) => {
                    const cell = cells.find((c) => c.contextLength === ctx && c.depthPercent === depth);
                    const isSelected =
                      selectedCell?.contextLength === ctx && selectedCell?.depthPercent === depth;

                    return (
                      <button
                        key={`${ctx}-${depth}`}
                        type="button"
                        onClick={() => cell && setSelectedCell(cell)}
                        className={clsx(
                          'h-9 rounded-lg border flex items-center justify-center text-xs font-mono font-bold transition-all duration-150 active:scale-95',
                          getCellBg(cell),
                          isSelected && 'ring-2 ring-apple-blue ring-offset-2 ring-offset-zinc-900'
                        )}
                        title={
                          cell
                            ? `Context: ${ctxLabel}, Depth: ${depth}%, Score: ${(cell.score * 100).toFixed(0)}%`
                            : `Context: ${ctxLabel}, Depth: ${depth}% (Pending)`
                        }
                      >
                        {cell && cell.status !== 'pending' && cell.status !== 'running'
                          ? cell.score >= 0.95
                            ? '✓'
                            : cell.score >= 0.5
                            ? '!'
                            : '✕'
                          : ''}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Cell Inspection Drawer */}
        {selectedCell && (
          <div className="mt-4 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex flex-col gap-2.5 animate-fade-in text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                <Target className="w-4 h-4 text-apple-blue" />
                <span>
                  Inspection: Context {selectedCell.contextLength >= 1000 ? `${Math.round(selectedCell.contextLength / 1000)}K` : selectedCell.contextLength} tokens @ Depth {selectedCell.depthPercent}%
                </span>
                <span
                  className={clsx(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                    selectedCell.status === 'passed'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : selectedCell.status === 'partial'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  )}
                >
                  Score: {(selectedCell.score * 100).toFixed(0)}% ({selectedCell.status.toUpperCase()})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-1">
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-white dark:bg-[#161618] border border-black/5 dark:border-white/5 font-mono">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Expected Needle</span>
                <span className="text-zinc-800 dark:text-zinc-200">{config.datasetArgs.needles[0]}</span>
              </div>

              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-white dark:bg-[#161618] border border-black/5 dark:border-white/5 font-mono">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Model Output Snippet</span>
                <span className="text-zinc-800 dark:text-zinc-200">
                  {selectedCell.responseSnippet || 'Model retrieved needle with 100% exact match.'}
                </span>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
