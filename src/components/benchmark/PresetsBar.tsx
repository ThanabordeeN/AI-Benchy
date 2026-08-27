'use client';

import React from 'react';
import { PRESET_TEMPLATES } from '@/utils/presets';
import { PresetTemplate, BenchmarkConfig } from '@/types/benchmark';
import { Zap, Gauge, Layers, Users, Cpu, Activity, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface PresetsBarProps {
  activePresetId?: string;
  onSelectPreset: (preset: PresetTemplate) => void;
}

const ICONS_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-3.5 h-3.5" />,
  Gauge: <Gauge className="w-3.5 h-3.5" />,
  Layers: <Layers className="w-3.5 h-3.5" />,
  Users: <Users className="w-3.5 h-3.5" />,
  Cpu: <Cpu className="w-3.5 h-3.5" />,
  Activity: <Activity className="w-3.5 h-3.5" />,
};

export const PresetsBar: React.FC<PresetsBarProps> = ({
  activePresetId,
  onSelectPreset,
}) => {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-apple-blue" />
          Benchmark Presets
        </span>
        <span className="text-[11px] text-zinc-400">Click to apply tuned configuration</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {PRESET_TEMPLATES.map((preset) => {
          const isSelected = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={clsx(
                'group relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-2 overflow-hidden',
                isSelected
                  ? 'bg-apple-blue/10 dark:bg-apple-blue/20 border-apple-blue shadow-apple-sm'
                  : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/5 dark:border-white/10 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={clsx(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                    isSelected
                      ? 'bg-apple-blue text-white'
                      : 'bg-black/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 group-hover:text-apple-blue'
                  )}
                >
                  {ICONS_MAP[preset.icon] || <Zap className="w-3.5 h-3.5" />}
                </div>

                <span
                  className={clsx(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    isSelected
                      ? 'bg-apple-blue text-white'
                      : 'bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400'
                  )}
                >
                  {preset.badge}
                </span>
              </div>

              <div>
                <h4
                  className={clsx(
                    'text-xs font-semibold leading-snug',
                    isSelected
                      ? 'text-apple-blue dark:text-apple-cyan'
                      : 'text-zinc-900 dark:text-zinc-100'
                  )}
                >
                  {preset.name}
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-tight">
                  {preset.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
