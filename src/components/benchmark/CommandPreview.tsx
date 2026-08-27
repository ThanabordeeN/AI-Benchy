'use client';

import React, { useState } from 'react';
import { BenchmarkConfig } from '@/types/benchmark';
import { generateFullCommands, buildCliArgs } from '@/utils/commandBuilder';
import { SegmentedControl } from '@/components/apple/SegmentedControl';
import { GlassCard } from '@/components/apple/GlassCard';
import { Copy, Check, Download, Terminal, Code2, Play, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface CommandPreviewProps {
  config: BenchmarkConfig;
  onExecuteSimulated?: () => void;
  onExecuteReal?: () => void;
  isRunning?: boolean;
}

type CommandType = 'cli' | 'uvx' | 'uvxPypi' | 'python' | 'script';

export const CommandPreview: React.FC<CommandPreviewProps> = ({
  config,
  onExecuteSimulated,
  onExecuteReal,
  isRunning = false,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<CommandType>('uvx');
  const [copied, setCopied] = useState(false);

  const commands = generateFullCommands(config);
  const activeCommandText = commands[selectedFormat] || commands.cli;
  const rawArgs = buildCliArgs(config);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCommandText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([commands.script], { type: 'text/x-sh' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark-${(config.model || 'llm').replace(/[^a-zA-Z0-9_-]/g, '_')}.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <GlassCard
      title="Generated CLI Command"
      subtitle="Interactive CLI command synced live with all parameters above"
      icon={<Terminal className="w-4 h-4 text-apple-blue" />}
      headerAction={
        <div className="flex items-center gap-2">
          {onExecuteSimulated && (
            <button
              type="button"
              onClick={onExecuteSimulated}
              disabled={isRunning}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Simulated Demo</span>
            </button>
          )}

          {onExecuteReal && (
            <button
              type="button"
              onClick={onExecuteReal}
              disabled={isRunning}
              className="px-4 py-1.5 rounded-xl bg-apple-blue hover:bg-apple-blue-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-apple-sm active:scale-95 transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Benchmarking...' : 'Run Benchmark'}</span>
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-3.5">
        {/* Command Format Selector & Copy Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl<CommandType>
            value={selectedFormat}
            onChange={setSelectedFormat}
            size="sm"
            options={[
              { id: 'uvx', label: 'uvx (Latest Git)' },
              { id: 'uvxPypi', label: 'uvx (PyPI)' },
              { id: 'cli', label: 'llama-benchy' },
              { id: 'python', label: 'python -m' },
              { id: 'script', label: 'Bash Script (.sh)' },
            ]}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadScript}
              title="Download standalone shell script"
              className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.sh Script</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={clsx(
                'px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95',
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-black/10 dark:border-white/10 hover:bg-zinc-50'
              )}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Command'}</span>
            </button>
          </div>
        </div>

        {/* Terminal Code Window */}
        <div className="relative rounded-xl bg-[#141416] border border-white/10 p-4 font-mono text-xs overflow-x-auto shadow-inner group">
          {/* Top terminal badge */}
          <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-2 mb-2 border-b border-white/5 select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              <span className="ml-2 text-zinc-400 font-sans">Terminal Execution</span>
            </div>
            <span>bash / zsh</span>
          </div>

          <pre className="text-emerald-400 leading-relaxed whitespace-pre font-mono">
            {activeCommandText}
          </pre>
        </div>

        {/* Argument breakdown badge overview */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Active flags:</span>
          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">
            --base-url {config.baseUrl}
          </span>
          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">
            --pp [{config.pp.join(', ')}]
          </span>
          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">
            --tg [{config.tg.join(', ')}]
          </span>
          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">
            --depth [{config.depth.join(', ')}]
          </span>
          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">
            --concurrency [{config.concurrency.join(', ')}]
          </span>
          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">
            --latency-mode {config.latencyMode}
          </span>
        </div>
      </div>
    </GlassCard>
  );
};
