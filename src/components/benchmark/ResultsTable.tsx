'use client';

import React, { useState } from 'react';
import { BenchmarkResultRow } from '@/types/benchmark';
import { GlassCard } from '@/components/apple/GlassCard';
import { SegmentedControl } from '@/components/apple/SegmentedControl';
import { formatTps, formatMs } from '@/utils/formatters';
import {
  Table as TableIcon,
  Copy,
  Check,
  Download,
  FileText,
  Layers,
  Zap,
  ArrowUpDown,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react';
import { clsx } from 'clsx';

interface ResultsTableProps {
  rows: BenchmarkResultRow[];
  rawMarkdown?: string;
  modelName?: string;
  onOpenReport?: () => void;
}

type TableViewMode = 'formatted' | 'raw' | 'csv';
type SortField = 'test' | 'tps' | 'peakTps' | 'ttfrMs' | 'depth' | 'concurrency';

export const ResultsTable: React.FC<ResultsTableProps> = ({
  rows,
  rawMarkdown = '',
  modelName = '',
  onOpenReport,
}) => {
  const [viewMode, setViewMode] = useState<TableViewMode>('formatted');
  const [sortField, setSortField] = useState<SortField>('depth');
  const [sortAsc, setSortAsc] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];
    if (valA === undefined) return 1;
    if (valB === undefined) return -1;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const generateMarkdownString = () => {
    if (rawMarkdown) return rawMarkdown;
    let out = `| model | test | t/s | peak t/s | ttfr (ms) | est_ppt (ms) | e2e_ttft (ms) |\n`;
    out += `|:---|---:|---:|---:|---:|---:|---:|\n`;
    for (const r of rows) {
      out += `| ${r.model} | ${r.test} | ${formatTps(r.tps, r.tpsStd)} | ${formatTps(r.peakTps, r.peakTpsStd)} | ${formatMs(r.ttfrMs, r.ttfrStd)} | ${formatMs(r.estPptMs, r.estPptStd)} | ${formatMs(r.e2eTtftMs, r.e2eTtftStd)} |\n`;
    }
    return out;
  };

  const generateCsvString = () => {
    let csv = 'model,test,pp,tg,depth,concurrency,tps,tps_std,peak_tps,peak_tps_std,ttfr_ms,ttfr_std,est_ppt_ms,est_ppt_std,e2e_ttft_ms,e2e_ttft_std\n';
    for (const r of rows) {
      csv += `"${r.model}","${r.test}",${r.pp},${r.tg},${r.depth},${r.concurrency},${r.tps || ''},${r.tpsStd || ''},${r.peakTps || ''},${r.peakTpsStd || ''},${r.ttfrMs || ''},${r.ttfrStd || ''},${r.estPptMs || ''},${r.estPptStd || ''},${r.e2eTtftMs || ''},${r.e2eTtftStd || ''}\n`;
    }
    return csv;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csvContent = generateCsvString();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark-${(modelName || 'results').replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const jsonContent = JSON.stringify(rows, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark-${(modelName || 'results').replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <GlassCard
      title="Benchmark Results Table"
      subtitle="Standard llama-bench output format with mean ± std statistics"
      icon={<TableIcon className="w-4 h-4 text-apple-blue" />}
      headerAction={
        <div className="flex items-center gap-2">
          <SegmentedControl<TableViewMode>
            value={viewMode}
            onChange={setViewMode}
            size="sm"
            options={[
              { id: 'formatted', label: 'Table' },
              { id: 'raw', label: 'Markdown' },
              { id: 'csv', label: 'CSV' },
            ]}
          />

          <div className="flex items-center gap-1.5 pl-2 border-l border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition active:scale-95',
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 text-zinc-700 dark:text-zinc-300'
              )}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy MD'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              title="Download CSV"
              className="p-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-zinc-700 dark:text-zinc-300 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              title="Download JSON"
              className="p-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-zinc-700 dark:text-zinc-300 transition"
            >
              <FileJson className="w-4 h-4" />
            </button>

            {onOpenReport && (
              <button
                type="button"
                onClick={onOpenReport}
                className="px-2.5 py-1 rounded-lg bg-apple-blue/15 text-apple-blue hover:bg-apple-blue/25 text-xs font-semibold flex items-center gap-1 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Full Report (.md)</span>
              </button>
            )}
          </div>
        </div>
      }
    >
      {rows.length === 0 ? (
        <div className="h-44 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
          <TableIcon className="w-10 h-10 stroke-[1.2] mb-2 text-zinc-300 dark:text-zinc-600" />
          <p className="text-xs text-zinc-500">
            Run a benchmark to populate the statistical results table.
          </p>
        </div>
      ) : viewMode === 'formatted' ? (
        <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] text-zinc-500 dark:text-zinc-400 font-semibold select-none">
                <th className="py-2.5 px-3.5">Model</th>
                <th
                  onClick={() => handleSort('test')}
                  className="py-2.5 px-3.5 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Test Shape</span>
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tps')}
                  className="py-2.5 px-3.5 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Speed (t/s)</span>
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('peakTps')}
                  className="py-2.5 px-3.5 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Peak (t/s)</span>
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('ttfrMs')}
                  className="py-2.5 px-3.5 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>TTFR (ms)</span>
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th className="py-2.5 px-3.5 text-right">Est. PPT (ms)</th>
                <th className="py-2.5 px-3.5 text-right">E2E TTFT (ms)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono">
              {sortedRows.map((r) => {
                const isPp = r.pp > 0;
                return (
                  <tr
                    key={r.id}
                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Model */}
                    <td className="py-2.5 px-3.5 font-sans font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[160px]">
                      {r.model}
                    </td>

                    {/* Test Shape Badge */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap font-sans">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-md text-[11px] font-mono font-bold flex items-center gap-1',
                            isPp
                              ? 'bg-blue-500/15 text-apple-blue dark:bg-apple-blue/25 dark:text-apple-cyan'
                              : 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400'
                          )}
                        >
                          {isPp ? <Layers className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                          {r.test}
                        </span>

                        {r.concurrency > 1 && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] font-mono font-semibold">
                            c{r.concurrency}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Speed t/s */}
                    <td className="py-2.5 px-3.5 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      <span className={isPp ? 'text-apple-blue dark:text-apple-cyan' : 'text-emerald-600 dark:text-emerald-400'}>
                        {formatTps(r.tps, r.tpsStd)}
                      </span>
                    </td>

                    {/* Peak t/s */}
                    <td className="py-2.5 px-3.5 text-right text-zinc-600 dark:text-zinc-400">
                      {r.peakTps ? formatTps(r.peakTps, r.peakTpsStd) : '—'}
                    </td>

                    {/* TTFR ms */}
                    <td className="py-2.5 px-3.5 text-right text-purple-600 dark:text-purple-400 font-medium">
                      {r.ttfrMs ? formatMs(r.ttfrMs, r.ttfrStd) : '—'}
                    </td>

                    {/* Est. PPT ms */}
                    <td className="py-2.5 px-3.5 text-right text-zinc-600 dark:text-zinc-400">
                      {r.estPptMs ? formatMs(r.estPptMs, r.estPptStd) : '—'}
                    </td>

                    {/* E2E TTFT ms */}
                    <td className="py-2.5 px-3.5 text-right text-zinc-600 dark:text-zinc-400">
                      {r.e2eTtftMs ? formatMs(r.e2eTtftMs, r.e2eTtftStd) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'raw' ? (
        <div className="rounded-xl bg-[#141416] p-4 font-mono text-xs text-zinc-300 overflow-x-auto border border-white/10 whitespace-pre">
          {generateMarkdownString()}
        </div>
      ) : (
        <div className="rounded-xl bg-[#141416] p-4 font-mono text-xs text-zinc-300 overflow-x-auto border border-white/10 whitespace-pre">
          {generateCsvString()}
        </div>
      )}
    </GlassCard>
  );
};
