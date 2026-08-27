'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/apple/GlassCard';
import { EvalScopeConfig } from '@/types/evalscope';
import { generateEvalScopePythonScript } from '@/utils/evalscope';
import { Code2, Copy, Check, Download, Terminal, Sparkles } from 'lucide-react';

interface NeedleCodePreviewProps {
  config: EvalScopeConfig;
}

export const NeedleCodePreview: React.FC<NeedleCodePreviewProps> = ({ config }) => {
  const [copied, setCopied] = useState(false);
  const pythonScript = generateEvalScopePythonScript(config);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evalscope_needle_${config.model.replace(/[^a-zA-Z0-9_-]/g, '_')}.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <GlassCard
        title="EvalScope Python Script & Runner"
        subtitle="Standalone executable Python script using ModelScope EvalScope framework"
        icon={<Code2 className="w-4 h-4 text-apple-blue" />}
        headerAction={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 text-zinc-700 dark:text-zinc-300"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Script'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .py</span>
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {/* Quick pip install info */}
          <div className="p-3 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 border border-apple-blue/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-apple-blue dark:text-apple-cyan">
              <Terminal className="w-4 h-4" />
              <span className="font-semibold">Installation:</span>
              <code className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">
                pip install "evalscope[needle_bench]"
              </code>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Supports official context up to 200k+
            </span>
          </div>

          {/* Syntax Highlighted Code block */}
          <pre className="p-4 rounded-xl bg-black/90 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-black/10 dark:border-white/10 shadow-inner">
            <code>{pythonScript}</code>
          </pre>
        </div>
      </GlassCard>
    </div>
  );
};
