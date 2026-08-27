'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface TagInputProps {
  label: string;
  sublabel?: string;
  flagName: string;
  values: number[];
  onChange: (newValues: number[]) => void;
  quickSuggestions?: number[];
  unit?: string;
  formatter?: (val: number) => string;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  sublabel,
  flagName,
  values,
  onChange,
  quickSuggestions = [],
  unit = '',
  formatter,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = (num: number) => {
    if (isNaN(num) || num < 0) return;
    if (!values.includes(num)) {
      const updated = [...values, num].sort((a, b) => a - b);
      onChange(updated);
    }
  };

  const handleRemove = (num: number) => {
    if (values.length <= 1) return; // Maintain at least 1 value
    onChange(values.filter((v) => v !== num));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const parsed = parseInt(inputValue.trim(), 10);
      if (!isNaN(parsed)) {
        handleAdd(parsed);
        setInputValue('');
      }
    }
  };

  const formatDisplay = (val: number) => {
    if (formatter) return formatter(val);
    if (val >= 1024) return `${(val / 1024).toFixed(val % 1024 === 0 ? 0 : 1)}k`;
    return val.toString();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            {label}
            <code className="text-[11px] font-mono text-apple-blue dark:text-apple-cyan bg-apple-blue/10 dark:bg-apple-blue/20 px-1.5 py-0.2 rounded">
              {flagName}
            </code>
          </span>
          {sublabel && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{sublabel}</p>
          )}
        </div>

        {/* Value count badge */}
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
          {values.length} shape{values.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Selected tags container */}
      <div className="min-h-[42px] p-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] backdrop-blur-md flex flex-wrap items-center gap-1.5">
        {values.map((val) => (
          <span
            key={val}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#2c2c2e] text-zinc-900 dark:text-zinc-100 border border-black/5 dark:border-white/10 shadow-apple-sm text-xs font-medium group transition-all"
          >
            <span className="font-mono font-semibold">{val}</span>
            <span className="text-[10px] text-zinc-400 font-mono">
              ({formatDisplay(val)}{unit})
            </span>
            {values.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemove(val)}
                className="w-3.5 h-3.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-red-500 transition"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </span>
        ))}

        {/* Input box */}
        <div className="flex-1 min-w-[80px]">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add val + Enter"
            className="w-full bg-transparent px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Quick Suggestions Chips */}
      {quickSuggestions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
            Presets:
          </span>
          {quickSuggestions.map((sug) => {
            const isAdded = values.includes(sug);
            return (
              <button
                key={sug}
                type="button"
                onClick={() => (isAdded ? handleRemove(sug) : handleAdd(sug))}
                className={clsx(
                  'text-[11px] px-2 py-0.5 rounded-md font-mono transition-all flex items-center gap-0.5',
                  isAdded
                    ? 'bg-apple-blue/15 text-apple-blue dark:bg-apple-blue/30 dark:text-apple-cyan font-semibold'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400'
                )}
              >
                <span>{formatDisplay(sug)}</span>
                {isAdded ? (
                  <span className="text-[9px] opacity-70">✓</span>
                ) : (
                  <Plus className="w-2.5 h-2.5 opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
