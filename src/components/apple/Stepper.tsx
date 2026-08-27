'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface StepperProps {
  label: string;
  sublabel?: string;
  flagName?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  quickOptions?: number[];
}

export const Stepper: React.FC<StepperProps> = ({
  label,
  sublabel,
  flagName,
  value,
  min = 1,
  max = 100,
  step = 1,
  unit = '',
  onChange,
  quickOptions,
}) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(Math.min(max, value + step));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            {label}
            {flagName && (
              <code className="text-[11px] font-mono text-apple-blue dark:text-apple-cyan bg-apple-blue/10 dark:bg-apple-blue/20 px-1.5 py-0.2 rounded">
                {flagName}
              </code>
            )}
          </span>
          {sublabel && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{sublabel}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Apple Stepper Pill */}
        <div className="inline-flex items-center rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 p-1">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={value <= min}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition active:scale-95 shadow-sm"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="w-14 text-center font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
            {value}
            {unit && <span className="text-xs font-normal text-zinc-400 ml-0.5">{unit}</span>}
          </span>

          <button
            type="button"
            onClick={handleIncrement}
            disabled={value >= max}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick selection pills if provided */}
        {quickOptions && quickOptions.length > 0 && (
          <div className="flex items-center gap-1">
            {quickOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={clsx(
                  'px-2 py-1 rounded-lg text-xs font-mono transition-all',
                  value === opt
                    ? 'bg-apple-blue text-white font-semibold shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
