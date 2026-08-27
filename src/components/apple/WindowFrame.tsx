'use client';

import React from 'react';
import { Sparkles, Moon, Sun, Terminal, Play, ShieldAlert, Cpu } from 'lucide-react';

interface WindowFrameProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onRunQuickSmoke?: () => void;
  statusBadge?: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  children,
  title = 'llama-benchy',
  subtitle = 'OpenAI-Compatible LLM Inference Benchmarker',
  isDark = true,
  onToggleTheme,
  onRunQuickSmoke,
  statusBadge,
}) => {
  return (
    <div className="min-h-screen w-full bg-[#f5f5f7] dark:bg-[#0c0c0e] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-300 antialiased flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 lg:p-8 font-sans selection:bg-apple-blue selection:text-white">
      {/* Main Window Container */}
      <div className="relative z-10 w-full max-w-[1440px] rounded-2xl md:rounded-[24px] border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#161618]/85 backdrop-blur-2xl shadow-apple-xl overflow-hidden flex flex-col transition-all duration-300">
        {/* macOS Title Bar */}
        <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] select-none backdrop-blur-md">
          {/* Traffic Lights */}
          <div className="flex items-center gap-2 w-24">
            <button
              aria-label="Close"
              className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:brightness-90 transition shadow-sm active:scale-95"
            />
            <button
              aria-label="Minimize"
              className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:brightness-90 transition shadow-sm active:scale-95"
            />
            <button
              aria-label="Zoom"
              className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] hover:brightness-90 transition shadow-sm active:scale-95"
            />
          </div>

          {/* Window Title & Subtitle */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-apple-blue" />
                {title}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-black/5 dark:border-white/10">
                v0.2.2
              </span>
            </div>
            {subtitle && (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline-block font-normal">
                {subtitle}
              </span>
            )}
          </div>

          {/* Window Right Action Tools */}
          <div className="flex items-center justify-end gap-2 w-auto md:w-48">
            {statusBadge}

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title="Toggle Light / Dark Mode"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition active:scale-95 text-zinc-700 dark:text-zinc-300"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main
          className="flex-1 w-full p-4 sm:p-6 md:p-8 flex flex-col gap-6"
          suppressHydrationWarning
        >
          {children}
        </main>

        {/* macOS Bottom Status Bar */}
        <footer className="h-9 px-4 md:px-6 flex items-center justify-between border-t border-black/5 dark:border-white/5 bg-black/[0.015] dark:bg-white/[0.015] text-[11px] text-zinc-500 dark:text-zinc-400 select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              llama-benchy Ready
            </span>
            <span className="hidden sm:inline-block text-zinc-400 dark:text-zinc-600">|</span>
            <span className="hidden sm:inline-block">OpenAI Chat Completions Protocol</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/eugr/llama-benchy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-apple-blue transition underline-offset-2 hover:underline"
            >
              GitHub / eugr/llama-benchy
            </a>
            <span className="text-zinc-400 dark:text-zinc-600">|</span>
            <span>macOS Tahoe UI Theme</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
