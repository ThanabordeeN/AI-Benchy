'use client';

import React from 'react';
import { clsx } from 'clsx';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  headerAction?: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  header,
  headerAction,
  title,
  subtitle,
  icon,
  glow = false,
}) => {
  return (
    <div
      className={clsx(
        'relative rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#1c1c1e]/70 backdrop-blur-xl shadow-apple-sm transition-all duration-300 overflow-hidden flex flex-col',
        className
      )}
    >
      {(header || title) && (
        <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
          {header ? (
            header
          ) : (
            <div className="flex items-center gap-2.5">
              {icon && (
                <div className="w-8 h-8 rounded-lg bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center">
                  {icon}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          )}
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">{children}</div>
    </div>
  );
};
