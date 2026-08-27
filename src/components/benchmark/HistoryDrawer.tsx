'use client';

import React, { useState } from 'react';
import { BenchmarkSession, BenchmarkConfig } from '@/types/benchmark';
import { GlassCard } from '@/components/apple/GlassCard';
import { formatTps, formatMs } from '@/utils/formatters';
import {
  History,
  Trash2,
  RotateCcw,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

interface HistoryDrawerProps {
  sessions: BenchmarkSession[];
  onLoadConfig: (config: BenchmarkConfig) => void;
  onSelectSession: (session: BenchmarkSession) => void;
  onClearHistory: () => void;
  onDeleteSession: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  sessions,
  onLoadConfig,
  onSelectSession,
  onClearHistory,
  onDeleteSession,
}) => {
  const [compareIdA, setCompareIdA] = useState<string | null>(null);
  const [compareIdB, setCompareIdB] = useState<string | null>(null);

  const sessionA = sessions.find((s) => s.id === compareIdA);
  const sessionB = sessions.find((s) => s.id === compareIdB);

  return (
    <GlassCard
      title="Benchmark History & Model Comparison"
      subtitle="Review past benchmark sessions or compare 2 models side-by-side"
      icon={<History className="w-4 h-4 text-apple-blue" />}
      headerAction={
        sessions.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="px-2.5 py-1 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 transition flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )
      }
    >
      {sessions.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center text-center p-4 text-zinc-400">
          <History className="w-8 h-8 stroke-[1.2] mb-2 text-zinc-300 dark:text-zinc-600" />
          <p className="text-xs text-zinc-500">No previous sessions saved yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Comparison View if 2 sessions selected */}
          {sessionA && sessionB && (
            <div className="p-4 rounded-xl bg-apple-blue/5 dark:bg-apple-blue/10 border border-apple-blue/20 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-apple-blue flex items-center gap-1.5">
                  <GitCompare className="w-4 h-4" />
                  Side-by-Side Model Comparison
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCompareIdA(null);
                    setCompareIdB(null);
                  }}
                  className="text-[11px] text-zinc-500 hover:underline"
                >
                  Close Comparison
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Session A Card */}
                <div className="p-3 rounded-lg bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/10">
                  <span className="text-[10px] text-zinc-400 font-mono block">RUN A</span>
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                    {sessionA.config.model || 'Auto-detected'}
                  </h4>
                  <p className="text-[10px] text-zinc-500">{sessionA.createdAt}</p>
                </div>

                {/* Session B Card */}
                <div className="p-3 rounded-lg bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/10">
                  <span className="text-[10px] text-zinc-400 font-mono block">RUN B</span>
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                    {sessionB.config.model || 'Auto-detected'}
                  </h4>
                  <p className="text-[10px] text-zinc-500">{sessionB.createdAt}</p>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black/5 dark:border-white/10 text-zinc-500 text-[11px]">
                      <th className="py-1 px-2 text-left">Test Shape</th>
                      <th className="py-1 px-2 text-right">Run A (t/s)</th>
                      <th className="py-1 px-2 text-right">Run B (t/s)</th>
                      <th className="py-1 px-2 text-right">Delta (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {sessionA.rows.map((rowA) => {
                      const rowB = sessionB.rows.find((r) => r.test === rowA.test);
                      if (!rowB) return null;
                      const delta = rowA.tps > 0 ? ((rowB.tps - rowA.tps) / rowA.tps) * 100 : 0;
                      const isPositive = delta > 0;
                      return (
                        <tr key={rowA.test}>
                          <td className="py-1.5 px-2 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                            {rowA.test}
                          </td>
                          <td className="py-1.5 px-2 text-right text-zinc-600 dark:text-zinc-300">
                            {formatTps(rowA.tps)}
                          </td>
                          <td className="py-1.5 px-2 text-right text-zinc-600 dark:text-zinc-300">
                            {formatTps(rowB.tps)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold">
                            <span
                              className={clsx(
                                'inline-flex items-center gap-0.5',
                                isPositive ? 'text-emerald-500' : 'text-rose-500'
                              )}
                            >
                              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {delta > 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sessions List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.map((session) => {
              const isCompA = compareIdA === session.id;
              const isCompB = compareIdB === session.id;

              return (
                <div
                  key={session.id}
                  className={clsx(
                    'p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3',
                    isCompA || isCompB
                      ? 'bg-apple-blue/10 dark:bg-apple-blue/20 border-apple-blue shadow-sm'
                      : 'bg-white dark:bg-zinc-800/80 border-black/5 dark:border-white/10 hover:border-apple-blue/40'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
                        {session.config.model || 'Benchmark Run'}
                      </h4>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {session.createdAt}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteSession(session.id)}
                      className="text-zinc-400 hover:text-rose-500 p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Summary badges */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                      {session.rows.length} test shapes
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-apple-blue">
                      --pp [{session.config.pp.join(',')}]
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                      --tg [{session.config.tg.join(',')}]
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-xs">
                    <button
                      type="button"
                      onClick={() => onSelectSession(session)}
                      className="text-apple-blue hover:underline font-semibold text-[11px]"
                    >
                      View Results
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onLoadConfig(session.config)}
                        title="Load configuration into editor"
                        className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[10px] text-zinc-600 dark:text-zinc-300 hover:bg-black/10 transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Load Config</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!compareIdA) setCompareIdA(session.id);
                          else if (!compareIdB && compareIdA !== session.id) setCompareIdB(session.id);
                          else if (compareIdA === session.id) setCompareIdA(null);
                          else if (compareIdB === session.id) setCompareIdB(null);
                        }}
                        className={clsx(
                          'px-2 py-0.5 rounded text-[10px] font-semibold transition',
                          isCompA || isCompB
                            ? 'bg-apple-blue text-white'
                            : 'bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-black/10'
                        )}
                      >
                        {isCompA ? 'Comp A' : isCompB ? 'Comp B' : 'Compare'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </GlassCard>
  );
};
