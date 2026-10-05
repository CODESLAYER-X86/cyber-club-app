'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimeframeOption = '1d' | '7d' | '1m' | '2m' | 'all';

export interface TimeframeConfig {
  key: TimeframeOption;
  label: string;
  shortLabel: string;
  description: string;
  days: number | null;
}

export const TIMEFRAME_OPTIONS: TimeframeConfig[] = [
  { key: '1d', label: '1 Day', shortLabel: '1D', description: 'Past 24 hours / Today', days: 1 },
  { key: '7d', label: '7 Days', shortLabel: '7D', description: 'Past 7 days', days: 7 },
  { key: '1m', label: '1 Month', shortLabel: '1M', description: 'Past 30 days', days: 30 },
  { key: '2m', label: '2 Months', shortLabel: '2M', description: 'Past 60 days', days: 60 },
  { key: 'all', label: 'All Time', shortLabel: 'All', description: 'Lifetime records', days: null },
];

/**
 * Checks whether a given timestamp falls within the timeframe.
 */
export function isDateWithinTimeframe(
  dateValue: string | Date | number | undefined | null,
  timeframe: TimeframeOption
): boolean {
  if (timeframe === 'all' || !dateValue) return true;

  const itemTime = new Date(dateValue).getTime();
  if (isNaN(itemTime)) return true;

  const now = Date.now();
  switch (timeframe) {
    case '1d': {
      // Past 24 hours or since start of today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const cutoff = Math.min(startOfToday.getTime(), now - 24 * 60 * 60 * 1000);
      return itemTime >= cutoff;
    }
    case '7d':
      return itemTime >= now - 7 * 24 * 60 * 60 * 1000;
    case '1m':
      return itemTime >= now - 30 * 24 * 60 * 60 * 1000;
    case '2m':
      return itemTime >= now - 60 * 24 * 60 * 60 * 1000;
    default:
      return true;
  }
}

/**
 * Filter an array of items by checking transaction `date` with fallback to `createdAt`.
 */
export function filterByTimeframe<T extends { date?: string | Date | null; createdAt?: string | Date | null }>(
  items: T[],
  timeframe: TimeframeOption
): T[] {
  if (timeframe === 'all') return items;
  return items.filter((item) => {
    const primaryDate = item.date || item.createdAt;
    return isDateWithinTimeframe(primaryDate, timeframe);
  });
}

/**
 * Friendly label for the active timeframe.
 */
export function getTimeframeLabel(timeframe: TimeframeOption): string {
  switch (timeframe) {
    case '1d':
      return 'Last 24 Hours / Today';
    case '7d':
      return 'Last 7 Days';
    case '1m':
      return 'Last 30 Days (1 Month)';
    case '2m':
      return 'Last 60 Days (2 Months)';
    case 'all':
      return 'All Time';
  }
}

interface TimelineFilterProps {
  value: TimeframeOption;
  onChange: (val: TimeframeOption) => void;
  size?: 'sm' | 'default';
  className?: string;
  showIcon?: boolean;
  labelPrefix?: string;
}

export function TimelineFilter({
  value,
  onChange,
  size = 'default',
  className,
  showIcon = true,
  labelPrefix = 'Timeline:',
}: TimelineFilterProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md select-none',
        className
      )}
      role="toolbar"
      aria-label="Filter transactions by timeline"
    >
      {showIcon && (
        <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-gray-400">
          <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          {labelPrefix && <span className="hidden sm:inline text-gray-400">{labelPrefix}</span>}
        </div>
      )}

      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {TIMEFRAME_OPTIONS.map((opt) => {
          const isActive = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              title={opt.description}
              className={cn(
                'relative rounded-lg font-medium transition-all duration-200 flex items-center justify-center whitespace-nowrap',
                size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm',
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              )}
            >
              <span className="sm:hidden">{opt.shortLabel}</span>
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
