'use client';

import React, { useState } from 'react';
import { Copy, Check, Download, X, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportMarkdown: string;
  modelName?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportMarkdown,
  modelName = 'llm',
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark-report-${modelName.replace(/[^a-zA-Z0-9_-]/g, '_')}-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all">
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Benchmark Report (.md)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  Ready for Export
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Structured Markdown document formatted by test shapes & metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm',
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 text-zinc-700 dark:text-zinc-200'
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
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
              className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-zinc-800 dark:text-zinc-200 bg-[#fbfbfd] dark:bg-[#141416]">
          <pre className="whitespace-pre-wrap font-mono leading-relaxed selection:bg-apple-blue selection:text-white">
            {reportMarkdown}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="h-11 px-6 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 bg-black/[0.01] dark:bg-white/[0.01]">
          <span>Compatible with GitHub Flavored Markdown, Obsidian, Notion & VS Code</span>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
