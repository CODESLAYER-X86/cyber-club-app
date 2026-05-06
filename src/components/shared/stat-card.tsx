'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
  delay?: number;
}

export function StatCard({ icon, label, value, trend, className, delay = 0 }: StatCardProps) {
  const isPositive = trend && trend.value > 0;
  const isNegative = trend && trend.value < 0;
  const isNeutral = trend && trend.value === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card
        className={cn(
          'group relative overflow-hidden border-white/5 bg-[#111] py-0 transition-all duration-300',
          'hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5',
          className
        )}
      >
        {/* Hover glow effect */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
        </div>

        <CardContent className="relative p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              {icon}
            </div>

            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  isPositive && 'bg-emerald-500/15 text-emerald-400',
                  isNegative && 'bg-red-500/15 text-red-400',
                  isNeutral && 'bg-gray-500/15 text-gray-400'
                )}
              >
                {isPositive && <TrendingUp className="h-3 w-3" />}
                {isNegative && <TrendingDown className="h-3 w-3" />}
                {isNeutral && <Minus className="h-3 w-3" />}
                <span>
                  {isPositive && '+'}
                  {trend.value}%
                </span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
            <p className="mt-1 text-xs text-gray-500">{label}</p>
          </div>

          {trend?.label && (
            <p className="mt-2 text-[11px] text-gray-600">{trend.label}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
