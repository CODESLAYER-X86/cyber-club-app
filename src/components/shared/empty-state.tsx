'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-gray-600">
        {icon ?? <Inbox className="h-8 w-8" />}
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-gray-300">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-gray-600">{description}</p>
        )}
      </div>

      {action && (
        <Button
          onClick={action.onClick}
          className="mt-2 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 hover:shadow-emerald-500/30"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
