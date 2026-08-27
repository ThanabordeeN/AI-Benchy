'use client';

import React, { useRef, useEffect, useState } from 'react';
import { GlassCard } from '@/components/apple/GlassCard';
import { ProgressEvent, BenchmarkResultRow } from '@/types/benchmark';
import { formatTps, formatMs } from '@/utils/formatters';
import { calculateSummaryMetrics } from '@/utils/reportGenerator';
import {
  Activity,
  Zap,
  Layers,
  Clock,
  Gauge,
  Terminal,
  StopCircle,
  RotateCcw,
  AlertTriangle,
  FileText,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';

interface LiveMonitorProps {
  isRunning: boolean;
  progressPercent: number;
  currentEvent?: ProgressEvent;
  latestRow?: BenchmarkResultRow;
  rows?: BenchmarkResultRow[];
  logs: string[];
  onCancel?: () => void;
  onReset?: () => void;
  onOpenReport?: () => void;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({
  isRunning,
  progressPercent,
  currentEvent,
  latestRow,
  rows = [],
  logs,
  onCancel,
  onReset,
  onOpenReport,
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = searchTerm
    ? logs.filter((l) => l.toLowerCase().includes(searchTerm.toLowerCase()))
    : logs;

  // Calculate real-time running metrics
  const summary = calculateSummaryMetrics(rows);
  const ppRows = rows.filter((r) => r.pp > 0);
  const tgRows = rows.filter((r) => r.tg > 0);
  const liveEventTps = currentEvent?.currentTps;

  // Find latest PP and TG values across all sources so cards never disappear
  const latestPpFromRows = ppRows.length > 0 ? ppRows[ppRows.length - 1] : undefined;
  const latestTgFromRows = tgRows.length > 0 ? tgRows[tgRows.length - 1] : undefined;

  const currentPpTps =
    (latestRow?.pp && latestRow.tps > 0)
      ? latestRow.tps
      : latestPpFromRows?.tps || summary.avgPpTps;

  const currentTgTps =
    (latestRow?.tg && latestRow.tps > 0)
      ? latestRow.tps
      : latestTgFromRows?.tps || summary.avgTgTps || liveEventTps;

  const currentTtfr =
    latestRow?.ttfrMs || latestPpFromRows?.ttfrMs || (currentEvent as any)?.ttfrMs || summary.avgTtfrMs;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Real-Time HUD Digital Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Prompt Processing Speed (PP) */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 shadow-apple-sm flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Prompt Processing (PP)
            </span>
            <div className="w-7 h-7 rounded-lg bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-apple-blue dark:text-apple-cyan tracking-tight">
              {currentPpTps && currentPpTps > 0 ? formatTps(currentPpTps) : '—'}
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-1">
              tokens / sec
              {ppRows.length > 1 && (
                <span className="text-[10px] text-zinc-400 font-sans">
                  (Avg: {formatTps(summary.avgPpTps)})
                </span>
              )}
            </span>
          </div>

          <div className="text-[10px] text-zinc-400 border-t border-black/5 dark:border-white/5 pt-1.5 flex items-center justify-between">
            <span>Prefill Throughput</span>
            <span className="font-mono">
              {latestPpFromRows ? `pp${latestPpFromRows.pp} @ d${latestPpFromRows.depth}` : `${ppRows.length} tests`}
            </span>
          </div>
        </div>

        {/* Metric 2: Token Generation Speed (TG) */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 shadow-apple-sm flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Token Generation (TG)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {currentTgTps && currentTgTps > 0 ? formatTps(currentTgTps) : '—'}
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              tokens / sec (Peak: {summary.peakTps > 0 ? formatTps(summary.peakTps) : '—'})
            </span>
          </div>

          <div className="text-[10px] text-zinc-400 border-t border-black/5 dark:border-white/5 pt-1.5 flex items-center justify-between">
            <span>Decode Throughput</span>
            <span className="font-mono">
              {latestTgFromRows ? `tg${latestTgFromRows.tg} @ d${latestTgFromRows.depth}` : `${tgRows.length} tests`}
            </span>
          </div>
        </div>

        {/* Metric 3: Time To First Response (TTFR) */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 shadow-apple-sm flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              TTFR Latency
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-purple-600 dark:text-purple-400 tracking-tight">
              {currentTtfr && currentTtfr > 0 ? formatMs(currentTtfr) : '—'}
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              Time to first response chunk
            </span>
          </div>

          <div className="text-[10px] text-zinc-400 border-t border-black/5 dark:border-white/5 pt-1.5 flex items-center justify-between">
            <span>Est. PPT</span>
            <span className="font-mono">{latestRow?.estPptMs ? formatMs(latestRow.estPptMs) : '—'}</span>
          </div>
        </div>

        {/* Metric 4: Test Shape & Live Execution */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 shadow-apple-sm flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Test Matrix Status
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity className={clsx('w-3.5 h-3.5', isRunning && 'animate-spin')} />
            </div>
          </div>

          <div className="my-2">
            <div className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {isRunning ? (currentEvent?.currentTest || 'Processing...') : rows.length > 0 ? 'Benchmark Complete' : 'Idle / Ready'}
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {isRunning
                ? `Test ${currentEvent?.testIndex || 1} of ${currentEvent?.totalTests || '—'} (Run ${currentEvent?.runIndex || 1}/${currentEvent?.totalRuns || 3})`
                : `${rows.length} total shapes completed`}
            </span>
          </div>

          <div className="text-[10px] text-zinc-400 border-t border-black/5 dark:border-white/5 pt-1.5 flex items-center justify-between">
            <span>Progress</span>
            <span className="font-mono font-bold text-apple-blue">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Running Averages Summary Bar (if tests exist) */}
      {rows.length > 0 && (
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 shadow-apple-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Executive Benchmark Averages (Mean ± Std)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue">
                  {rows.length} shapes
                </span>
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Mean Prefill: <strong className="text-apple-blue">{formatTps(summary.avgPpTps)} t/s</strong> •
                Mean Decode: <strong className="text-emerald-600 dark:text-emerald-400">{formatTps(summary.avgTgTps)} t/s</strong> •
                Mean TTFR: <strong className="text-purple-600 dark:text-purple-400">{formatMs(summary.avgTtfrMs)}</strong> •
                Peak: <strong className="text-amber-500">{formatTps(summary.peakTps)} t/s</strong>
              </p>
            </div>
          </div>

          {onOpenReport && (
            <button
              type="button"
              onClick={onOpenReport}
              className="px-3.5 py-1.5 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Report (.md)</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Progress Bar & Stage Indicator */}
      <div className="p-4 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-black/5 dark:border-white/10 backdrop-blur-xl flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'w-2.5 h-2.5 rounded-full',
                isRunning ? 'bg-apple-blue animate-pulse' : 'bg-emerald-500'
              )}
            />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {currentEvent?.message || (isRunning ? 'Running benchmark...' : 'Benchmark ready')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isRunning && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-600 hover:bg-red-500/25 text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <StopCircle className="w-3 h-3" />
                <span>Stop</span>
              </button>
            )}

            {!isRunning && logs.length > 0 && onReset && (
              <button
                type="button"
                onClick={onReset}
                className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress track */}
        <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-apple-blue to-apple-cyan transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(isRunning ? 5 : 0, Math.min(100, progressPercent))}%` }}
          />
        </div>
      </div>

      {/* 4. Smart Error / Diagnosis Alert Card */}
      {logs.some(
        (l) =>
          l.includes('Context size has been exceeded') ||
          l.includes('No results collected') ||
          l.includes('failed to find free space in the KV cache')
      ) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col gap-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300">
                LM Studio / Server Error: Context Size Exceeded
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                LM Studio&apos;s server rejected the batch with <code className="px-1 py-0.5 bg-amber-500/20 rounded font-mono">500: Context size has been exceeded</code>.
                The combined context (<span className="font-mono">--depth + --pp</span>) across parallel clients exceeds the model&apos;s active Context Window in LM Studio.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/20 text-xs">
            <span className="font-semibold text-amber-800 dark:text-amber-300">Recommended Actions:</span>
            <span className="text-[11px] text-amber-700 dark:text-amber-400">
              1. Reduce to <code className="font-mono bg-amber-500/20 px-1 rounded">--pp 512</code>, <code className="font-mono bg-amber-500/20 px-1 rounded">--tg 32</code>, <code className="font-mono bg-amber-500/20 px-1 rounded">--depth 0</code>, <code className="font-mono bg-amber-500/20 px-1 rounded">--concurrency 1</code>
            </span>
            <span className="text-[11px] text-amber-700 dark:text-amber-400">
              2. Or increase <strong>Context Length (n_ctx)</strong> to 16384/32768 in LM Studio
            </span>
          </div>
        </div>
      )}

      {/* 5. Live Stream Terminal Logs */}
      <GlassCard
        title="Live Stream Console"
        subtitle="Real-time output stream from llama-benchy (--emit-progress)"
        icon={<Terminal className="w-4 h-4 text-apple-blue" />}
        headerAction={
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter logs..."
              className="h-7 px-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-800/50 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setAutoScroll(!autoScroll)}
              className={clsx(
                'px-2 py-1 rounded-lg text-[10px] font-medium border transition',
                autoScroll
                  ? 'bg-apple-blue/15 text-apple-blue border-apple-blue/30'
                  : 'bg-black/5 dark:bg-white/10 text-zinc-500 border-transparent'
              )}
            >
              Auto-scroll {autoScroll ? 'ON' : 'OFF'}
            </button>
          </div>
        }
      >
        <div className="h-48 sm:h-64 rounded-xl bg-[#0e0e10] border border-white/10 p-3 font-mono text-xs text-zinc-300 overflow-y-auto space-y-1">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-600 select-none">
              Console output stream will appear here when benchmark starts...
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div
                key={idx}
                className={clsx(
                  'leading-relaxed break-all',
                  log.includes('[stderr]') || log.includes('error') || log.includes('Failed')
                    ? 'text-rose-400'
                    : log.includes('pp') || log.includes('tg') || log.includes('Completed')
                    ? 'text-emerald-400'
                    : log.includes('Warmup') || log.includes('coherence')
                    ? 'text-amber-300'
                    : 'text-zinc-300'
                )}
              >
                {log}
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </GlassCard>
    </div>
  );
};
