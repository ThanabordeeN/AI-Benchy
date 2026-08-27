'use client';

import React, { useState } from 'react';
import { EvalScopeConfig, HeatmapCell } from '@/types/evalscope';
import { generateNeedleMarkdownReport } from '@/utils/evalscope';
import { X, Copy, Check, Download, FileText, CheckCircle2 } from 'lucide-react';

interface NeedleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EvalScopeConfig;
  cells: HeatmapCell[];
}

export const NeedleReportModal: React.FC<NeedleReportModalProps> = ({
  isOpen,
  onClose,
  config,
  cells,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const markdownReport = generateNeedleMarkdownReport(config, cells);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownReport], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evalscope_needle_report_${config.model.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl bg-white/95 dark:bg-[#1c1c1e]/95 border border-black/10 dark:border-white/10 shadow-apple-2xl flex flex-col overflow-hidden transition-all duration-300">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
                EvalScope NIAH Benchmark Report (.md)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Formatted Long-Context Retrieval Heatmap Matrix Report
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 text-zinc-700 dark:text-zinc-300"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body Preview */}
        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-zinc-800 dark:text-zinc-200 bg-black/[0.01] dark:bg-black/[0.2] selection:bg-apple-blue selection:text-white">
          <pre className="whitespace-pre-wrap leading-relaxed">
            {markdownReport}
          </pre>
        </div>
      </div>
    </div>
  );
};
