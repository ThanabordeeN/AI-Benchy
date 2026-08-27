'use client';

import React from 'react';
import { clsx } from 'clsx';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}) => {
  return (
    <label
      className={clsx(
        'inline-flex items-center justify-between gap-3 select-none transition-opacity',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      )}
    >
      {(label || description) && (
        <div className="flex flex-col text-left">
          {label && (
            <span className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
              {description}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onChange(!checked);
        }}
        className={clsx(
          'relative inline-flex flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue',
          size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
          checked
            ? 'bg-[#34c759] shadow-sm'
            : 'bg-zinc-300 dark:bg-zinc-700'
        )}
      >
        <span
          className={clsx(
            'pointer-events-none inline-block transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
            size === 'sm'
              ? clsx('h-4 w-4 my-0.5', checked ? 'translate-x-4 ml-0.5' : 'translate-x-0.5')
              : clsx('h-5 w-5 my-0.5', checked ? 'translate-x-5 ml-0.5' : 'translate-x-0.5')
          )}
        />
      </button>
    </label>
  );
};
