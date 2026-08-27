'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={clsx(
        'relative inline-flex p-1 rounded-xl bg-black/[0.06] dark:bg-white/[0.08] backdrop-blur-md border border-black/5 dark:border-white/5 select-none transition-all',
        fullWidth ? 'w-full flex' : 'w-auto'
      )}
    >
      {options.map((option) => {
        const isSelected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={clsx(
              'relative z-10 flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-lg cursor-pointer',
              fullWidth ? 'flex-1' : '',
              size === 'sm' && 'px-2.5 py-1 text-xs',
              size === 'md' && 'px-3.5 py-1.5 text-xs sm:text-sm',
              size === 'lg' && 'px-4 py-2 text-sm',
              isSelected
                ? 'bg-white dark:bg-[#2c2c2e] text-zinc-900 dark:text-white shadow-apple-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            )}
          >
            {option.icon && <span className="w-4 h-4 flex items-center justify-center">{option.icon}</span>}
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={clsx(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                  isSelected
                    ? 'bg-apple-blue/15 text-apple-blue dark:bg-apple-blue/30 dark:text-apple-cyan'
                    : 'bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400'
                )}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
