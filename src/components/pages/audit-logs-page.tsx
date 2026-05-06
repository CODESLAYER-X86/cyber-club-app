'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Search, CheckCircle, UserCheck, Wallet,
  XCircle, AlertTriangle, Plus, Activity, Users,
  Clock, Shield, CreditCard, Ban,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user?: { name: string; email: string };
}

const ACTION_CONFIG: Record<string, {
  icon: typeof FileText;
  color: string;
  borderColor: string;
  badgeClass: string;
}> = {
  PAYMENT_VERIFIED: {
    icon: CheckCircle,
    color: 'text-emerald-400 bg-emerald-500/10',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400',
  },
  PAYMENT_REJECTED: {
    icon: Ban,
    color: 'text-red-400 bg-red-500/10',
    borderColor: 'border-l-red-400',
    badgeClass: 'border-red-500/30 text-red-400',
  },
  EXPENSE_APPROVED: {
    icon: CheckCircle,
    color: 'text-emerald-400 bg-emerald-500/10',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400',
  },
  EXPENSE_REJECTED: {
    icon: XCircle,
    color: 'text-red-400 bg-red-500/10',
    borderColor: 'border-l-red-400',
    badgeClass: 'border-red-500/30 text-red-400',
  },
  ROLE_ASSIGNED: {
    icon: UserCheck,
    color: 'text-amber-400 bg-amber-500/10',
    borderColor: 'border-l-amber-400',
    badgeClass: 'border-amber-500/30 text-amber-400',
  },
  BUDGET_CREATED: {
    icon: Wallet,
    color: 'text-cyan-400 bg-cyan-500/10',
    borderColor: 'border-l-cyan-400',
    badgeClass: 'border-cyan-500/30 text-cyan-400',
  },
  EVENT_CREATED: {
    icon: Plus,
    color: 'text-violet-400 bg-violet-500/10',
    borderColor: 'border-l-violet-400',
    badgeClass: 'border-violet-500/30 text-violet-400',
  },
  USER_REGISTERED: {
    icon: Users,
    color: 'text-cyan-400 bg-cyan-500/10',
    borderColor: 'border-l-cyan-400',
    badgeClass: 'border-cyan-500/30 text-cyan-400',
  },
};

type FilterTab = 'ALL' | 'PAYMENT' | 'EXPENSE' | 'ROLE' | 'OTHER';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PAYMENT', label: 'Payment' },
  { key: 'EXPENSE', label: 'Expense' },
  { key: 'ROLE', label: 'Role' },
  { key: 'OTHER', label: 'Other' },
];

const SVG_PATTERN = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+`;

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 2) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function getActionCategory(action: string): FilterTab {
  if (action.startsWith('PAYMENT_')) return 'PAYMENT';
  if (action.startsWith('EXPENSE_')) return 'EXPENSE';
  if (action.startsWith('ROLE_')) return 'ROLE';
  return 'OTHER';
}

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] || {
    icon: FileText,
    color: 'text-gray-400 bg-gray-500/10',
    borderColor: 'border-l-gray-400',
    badgeClass: 'border-white/10 text-gray-400',
  };
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemAnim = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

const PAGE_SIZE = 15;

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/audit-logs?limit=50');
        const d = await r.json();
        if (d.success) setLogs(d.data.auditLogs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter by search and category
  const filtered = useMemo(() => {
    let result = logs;
    if (activeFilter !== 'ALL') {
      result = result.filter(l => getActionCategory(l.action) === activeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q)
      );
    }
    return result;
  }, [logs, activeFilter, search]);

  const visibleLogs = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysActivity = logs.filter(l => new Date(l.createdAt) >= todayStart).length;
  const uniqueUsers = new Set(logs.map(l => l.user?.email).filter(Boolean)).size;

  // Filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = { ALL: logs.length, PAYMENT: 0, EXPENSE: 0, ROLE: 0, OTHER: 0 };
    logs.forEach(l => {
      counts[getActionCategory(l.action)]++;
    });
    return counts;
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Gradient Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/15 to-emerald-600/10 border border-emerald-500/10 p-6"
      >
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: `url("${SVG_PATTERN}")` }} />
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
            <FileText className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
            <p className="text-sm text-gray-400">System activity and change tracking</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid gap-4 grid-cols-3">
        <StatCard icon={Activity} label="Total Logs" value={logs.length.toString()} delay={0} />
        <StatCard icon={Clock} label="Today's Activity" value={todaysActivity.toString()} trend={todaysActivity > 5 ? 'up' : 'neutral'} delay={0.05} />
        <StatCard icon={Users} label="Unique Users" value={uniqueUsers.toString()} delay={0.1} />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map(tab => {
          const count = filterCounts[tab.key];
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveFilter(tab.key); setVisibleCount(PAGE_SIZE); }}
              className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                  : 'bg-white/[0.02] text-gray-500 border-white/5 hover:bg-white/5 hover:text-gray-400'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className={`h-4 min-w-[18px] px-1 text-[10px] rounded-full ${
                    isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-600'
                  }`}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input value={search} onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Search logs..." className="border-white/10 bg-white/5 pl-10 text-white" />
      </div>

      {/* Logs Timeline */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/5 mb-4">
            <FileText className="h-10 w-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-1">No logs found</h3>
          <p className="text-sm text-gray-600 max-w-xs">No audit logs match your current filter or search criteria.</p>
        </motion.div>
      ) : (
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/30 via-cyan-500/20 to-transparent" />

          <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
            {visibleLogs.map((log) => {
              const config = getActionConfig(log.action);
              const ActionIcon = config.icon;

              return (
                <motion.div key={log.id} variants={itemAnim} whileHover={{ y: -1, transition: { duration: 0.12 } }}>
                  <Card className={`border-white/5 border-l-2 ${config.borderColor} bg-[#111]/60 backdrop-blur transition-all hover:border-white/10 hover:shadow-lg hover:shadow-emerald-500/5 ml-6`}>
                    {/* Timeline dot */}
                    <div className="absolute -left-[25px] top-3 flex h-3 w-3 items-center justify-center">
                      <div className={`h-2.5 w-2.5 rounded-full border-2 border-[#111] ${
                        config.borderColor === 'border-l-emerald-400' ? 'bg-emerald-400' :
                        config.borderColor === 'border-l-amber-400' ? 'bg-amber-400' :
                        config.borderColor === 'border-l-cyan-400' ? 'bg-cyan-400' :
                        config.borderColor === 'border-l-red-400' ? 'bg-red-400' :
                        config.borderColor === 'border-l-violet-400' ? 'bg-violet-400' :
                        'bg-gray-400'
                      }`} />
                    </div>
                    <CardContent className="flex items-center gap-4 py-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.color}`}>
                        <ActionIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] ${config.badgeClass}`}>
                            {log.action}
                          </Badge>
                          <span className="text-xs text-gray-500">{log.user?.name || 'System'}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-gray-600 shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {timeAgo(log.createdAt)}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-4 ml-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                Load More ({filtered.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
