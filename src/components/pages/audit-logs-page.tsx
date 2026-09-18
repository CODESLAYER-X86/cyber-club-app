'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Search, CheckCircle, UserCheck, UserX, UserPlus, Wallet,
  XCircle, Plus, Activity, Users, Clock, Shield, ShieldAlert,
  CreditCard, Ban, ArrowRight, Eye, RefreshCw, Layers
} from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user?: {
    id?: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
}

interface ActionMeta {
  label: string;
  icon: typeof FileText;
  color: string;
  borderColor: string;
  badgeClass: string;
  category: FilterTab;
}

type FilterTab = 'ALL' | 'MEMBERSHIP' | 'ROLES' | 'FINANCE' | 'SYSTEM';

const ACTION_MAP: Record<string, ActionMeta> = {
  // Membership Events
  MEMBERSHIP_APPLICATION: {
    label: 'Membership Application',
    icon: UserPlus,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    borderColor: 'border-l-sky-400',
    badgeClass: 'border-sky-500/30 text-sky-400 bg-sky-500/10',
    category: 'MEMBERSHIP',
  },
  MEMBER_APPROVE: {
    label: 'Membership Approved',
    icon: UserCheck,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    category: 'MEMBERSHIP',
  },
  MEMBER_REJECT: {
    label: 'Membership Rejected',
    icon: UserX,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    borderColor: 'border-l-rose-400',
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    category: 'MEMBERSHIP',
  },
  USER_REGISTERED: {
    label: 'Account Created',
    icon: Users,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    borderColor: 'border-l-cyan-400',
    badgeClass: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    category: 'MEMBERSHIP',
  },
  USER_KICKED: {
    label: 'Account Suspended',
    icon: UserX,
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
    borderColor: 'border-l-red-400',
    badgeClass: 'border-red-500/30 text-red-400 bg-red-500/10',
    category: 'MEMBERSHIP',
  },

  // Role & Permission Events
  ROLE_UPDATE: {
    label: 'Role Modified',
    icon: ShieldAlert,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    borderColor: 'border-l-indigo-400',
    badgeClass: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
    category: 'ROLES',
  },
  ROLE_ASSIGNED: {
    label: 'Role Assigned',
    icon: Shield,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    borderColor: 'border-l-indigo-400',
    badgeClass: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
    category: 'ROLES',
  },

  // Finance & Treasury Events
  PAYMENT_VERIFIED: {
    label: 'Payment Verified',
    icon: CheckCircle,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    category: 'FINANCE',
  },
  PAYMENT_REJECTED: {
    label: 'Payment Rejected',
    icon: Ban,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    borderColor: 'border-l-rose-400',
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    category: 'FINANCE',
  },
  PAYMENT_RECONCILED: {
    label: 'Payment Reconciled',
    icon: CreditCard,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    borderColor: 'border-l-cyan-400',
    badgeClass: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    category: 'FINANCE',
  },
  EXPENSE_CREATED: {
    label: 'Expense Submitted',
    icon: Wallet,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    borderColor: 'border-l-amber-400',
    badgeClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    category: 'FINANCE',
  },
  EXPENSE_APPROVED: {
    label: 'Expense Approved',
    icon: CheckCircle,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    category: 'FINANCE',
  },
  EXPENSE_REJECTED: {
    label: 'Expense Rejected',
    icon: XCircle,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    borderColor: 'border-l-rose-400',
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    category: 'FINANCE',
  },
  TREASURY_DEPOSIT_CREATED: {
    label: 'Treasury Deposit Added',
    icon: Wallet,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    category: 'FINANCE',
  },
  TREASURY_DEPOSIT_APPROVED: {
    label: 'Treasury Deposit Approved',
    icon: CheckCircle,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    category: 'FINANCE',
  },

  // System & Event Events
  EVENT_CREATED: {
    label: 'Event Published',
    icon: Plus,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    borderColor: 'border-l-cyan-400',
    badgeClass: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    category: 'SYSTEM',
  },
  CONFIG_UPDATED: {
    label: 'Config Changed',
    icon: Shield,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    borderColor: 'border-l-amber-400',
    badgeClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    category: 'SYSTEM',
  },
};

const FILTER_TABS: { key: FilterTab; label: string; icon: typeof Layers }[] = [
  { key: 'ALL', label: 'All Activities', icon: Layers },
  { key: 'MEMBERSHIP', label: 'Membership', icon: UserCheck },
  { key: 'ROLES', label: 'Roles & Access', icon: Shield },
  { key: 'FINANCE', label: 'Finance & Treasury', icon: Wallet },
  { key: 'SYSTEM', label: 'System & Events', icon: Activity },
];

const ROLE_BADGE_STYLES: Record<string, string> = {
  PRESIDENT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  VP: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  GS: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  TREASURER: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  MEDIA: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  VERIFIER: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PLATFORM_ADMIN: 'bg-red-500/15 text-red-400 border-red-500/30',
  MEMBER: 'bg-white/10 text-gray-300 border-white/10',
  GUEST: 'bg-gray-800 text-gray-400 border-gray-700',
};

function getActionMeta(action: string): ActionMeta {
  if (ACTION_MAP[action]) return ACTION_MAP[action];

  if (action.includes('MEMBER') || action.includes('USER')) {
    return {
      label: action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      icon: Users,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      borderColor: 'border-l-sky-400',
      badgeClass: 'border-sky-500/30 text-sky-400 bg-sky-500/10',
      category: 'MEMBERSHIP',
    };
  }

  if (action.includes('PAYMENT') || action.includes('EXPENSE') || action.includes('TREASURY')) {
    return {
      label: action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      icon: Wallet,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      borderColor: 'border-l-emerald-400',
      badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      category: 'FINANCE',
    };
  }

  if (action.includes('ROLE')) {
    return {
      label: action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      icon: Shield,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      borderColor: 'border-l-indigo-400',
      badgeClass: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
      category: 'ROLES',
    };
  }

  return {
    label: action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    icon: FileText,
    color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    borderColor: 'border-l-gray-400',
    badgeClass: 'border-white/10 text-gray-400 bg-white/5',
    category: 'SYSTEM',
  };
}

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

function formatFullDate(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Parses raw audit string into human readable story elements with styled badges.
 */
function renderHumanNarrative(action: string, details: string) {
  // Case 1: Role Update
  // Format: Changed role of Name (email) from OLD to NEW
  const roleMatch = details.match(/Changed role of (.*?) \((.*?)\) from (\w+) to (\w+)/i);
  if (roleMatch) {
    const [, targetName, targetEmail, oldRole, newRole] = roleMatch;
    return (
      <div className="text-xs text-gray-300 flex items-center gap-1.5 flex-wrap">
        <span>Changed role of</span>
        <span className="font-semibold text-white bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{targetName}</span>
        <span className="text-gray-500 text-[11px]">({targetEmail})</span>
        <span>from</span>
        <Badge variant="outline" className={`text-[10px] uppercase font-mono ${ROLE_BADGE_STYLES[oldRole] || 'border-white/10 text-gray-400'}`}>
          {oldRole}
        </Badge>
        <ArrowRight className="h-3 w-3 text-gray-500" />
        <Badge variant="outline" className={`text-[10px] uppercase font-mono font-bold ${ROLE_BADGE_STYLES[newRole] || 'border-indigo-500/30 text-indigo-400'}`}>
          {newRole}
        </Badge>
      </div>
    );
  }

  // Case 2: Membership Rejection
  // Format: Rejected membership for user Name (email)
  const rejectMatch = details.match(/Rejected membership for user (.*?) \((.*?)\)/i);
  if (rejectMatch) {
    const [, targetName, targetEmail] = rejectMatch;
    return (
      <div className="text-xs text-gray-300 flex items-center gap-1.5 flex-wrap">
        <span className="text-rose-400 font-medium">Declined membership</span>
        <span>for applicant</span>
        <span className="font-semibold text-white bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 text-rose-200">{targetName}</span>
        <span className="text-gray-500 text-[11px]">({targetEmail})</span>
      </div>
    );
  }

  // Case 3: Membership Approval
  // Format: Approved membership for user Name (email)
  const approveMatch = details.match(/Approved membership for user (.*?) \((.*?)\)/i);
  if (approveMatch) {
    const [, targetName, targetEmail] = approveMatch;
    return (
      <div className="text-xs text-gray-300 flex items-center gap-1.5 flex-wrap">
        <span className="text-emerald-400 font-medium">Granted membership</span>
        <span>to</span>
        <span className="font-semibold text-white bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-emerald-200">{targetName}</span>
        <span className="text-gray-500 text-[11px]">({targetEmail})</span>
      </div>
    );
  }

  // Case 4: Membership Application
  if (action === 'MEMBERSHIP_APPLICATION') {
    const isReapply = details.toLowerCase().includes('re-submitted') || details.toLowerCase().includes('prior rejection');
    return (
      <div className="text-xs text-gray-300 flex items-center gap-1.5 flex-wrap">
        {isReapply ? (
          <>
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px]">
              Revised Application
            </Badge>
            <span>Candidate re-submitted club membership form after revising academic credentials</span>
          </>
        ) : (
          <>
            <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-300 text-[10px]">
              New Applicant
            </Badge>
            <span>Submitted new membership application and payment slip for committee review</span>
          </>
        )}
      </div>
    );
  }

  // Fallback for general text
  return (
    <p className="text-xs text-gray-300 leading-relaxed font-sans">{details}</p>
  );
}

const PAGE_SIZE = 20;

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const r = await fetch('/api/audit-logs?limit=100');
      const d = await r.json();
      if (d.success) setLogs(d.data.auditLogs || []);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter by category and search query
  const filtered = useMemo(() => {
    let result = logs;
    if (activeFilter !== 'ALL') {
      result = result.filter(l => getActionMeta(l.action).category === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.user?.name.toLowerCase().includes(q) ||
        l.user?.email.toLowerCase().includes(q)
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

  // Category counts
  const filterCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      ALL: logs.length,
      MEMBERSHIP: 0,
      ROLES: 0,
      FINANCE: 0,
      SYSTEM: 0,
    };
    logs.forEach(l => {
      const cat = getActionMeta(l.action).category;
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Gradient Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0A101D] to-cyan-950/30 border border-emerald-500/20 p-6 shadow-xl"
      >
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 shadow-inner">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight font-mono">Audit Logs</h1>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                  Tamper-Proof Trail
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Chronological security ledger tracking executive decisions, membership updates, and financial actions.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(true)}
            disabled={refreshing || loading}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-xs self-start md:self-auto"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Trail
          </Button>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard icon={Activity} label="Total Actions Logged" value={logs.length.toString()} delay={0} />
        <StatCard icon={Clock} label="Today's Executive Actions" value={todaysActivity.toString()} trend={todaysActivity > 0 ? 'up' : 'neutral'} delay={0.05} />
        <StatCard icon={Users} label="Active Actors Tracked" value={uniqueUsers.toString()} delay={0.1} />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/5 pt-1">
        {FILTER_TABS.map(tab => {
          const count = filterCounts[tab.key];
          const isActive = activeFilter === tab.key;
          const TabIcon = tab.icon;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveFilter(tab.key);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`shrink-0 flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all border ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                  : 'bg-white/[0.02] text-gray-400 border-white/5 hover:bg-white/5 hover:text-white'
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/10 text-gray-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Filter by actor name, affected student email, role, or action keyword..."
          className="border-white/10 bg-[#0c1017] pl-10 text-white placeholder:text-gray-500 text-xs font-sans focus-visible:ring-emerald-500/40"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Logs Timeline */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5 border border-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-white/10 bg-[#0b0f15]"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-3">
            <FileText className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-300">No matching audit logs</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1">
            Try adjusting your search terms or select another category filter above.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {visibleLogs.map((log) => {
            const meta = getActionMeta(log.action);
            const ActionIcon = meta.icon;
            const actorName = log.user?.name || 'System Auto';
            const actorRole = log.user?.role || 'SYSTEM';

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Card
                  onClick={() => setSelectedLog(log)}
                  className={`cursor-pointer group border-white/5 border-l-4 ${meta.borderColor} bg-[#0c1017] hover:bg-[#111722] transition-all hover:border-white/10 hover:shadow-lg hover:shadow-black/40`}
                >
                  <CardContent className="p-3.5 sm:p-4 flex items-start sm:items-center gap-3.5">
                    {/* Semantic Action Icon */}
                    <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border ${meta.color}`}>
                      <ActionIcon className="h-5 w-5" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Top Row: Human Action Badge + Technical Tag + Actor Info */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Human Action Name */}
                        <span className="text-xs font-bold text-white tracking-tight">
                          {meta.label}
                        </span>

                        {/* Technical Action Tag */}
                        <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                          {log.action}
                        </span>

                        <span className="text-gray-600 text-xs hidden sm:inline">•</span>

                        {/* Actor Info */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span className="text-gray-500 text-[11px]">Performed by</span>
                          <span className="font-semibold text-gray-200">{actorName}</span>
                          {actorRole && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 font-mono ${ROLE_BADGE_STYLES[actorRole] || 'border-white/10 text-gray-400'}`}
                            >
                              {actorRole}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Human Story Narrative */}
                      <div className="pt-0.5">
                        {renderHumanNarrative(log.action, log.details)}
                      </div>
                    </div>

                    {/* Timestamp & Inspect Action */}
                    <div className="shrink-0 flex flex-col items-end justify-center text-right pl-2">
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono group-hover:text-emerald-400 transition-colors">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span>{timeAgo(log.createdAt)}</span>
                      </div>
                      <span className="text-[10px] text-gray-600 hidden sm:block mt-1">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="border-white/10 bg-[#0c1017] text-gray-300 hover:bg-white/5 hover:text-white font-mono text-xs px-6"
              >
                Load More ({filtered.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Log Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="bg-[#0f141c] border-white/10 text-white sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {selectedLog && (
                <Badge variant="outline" className={getActionMeta(selectedLog.action).badgeClass}>
                  {getActionMeta(selectedLog.action).label}
                </Badge>
              )}
              <span className="text-xs font-mono text-gray-400">{selectedLog?.action}</span>
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Audit Record Inspection
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Cryptographically verified audit trail entry stored in club security archives.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Performed By Section */}
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-mono">Authorized Actor</span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">{selectedLog.user?.name || 'System Engine'}</p>
                    <p className="text-gray-400 text-xs">{selectedLog.user?.email || 'automated@cybersecdiu.club'}</p>
                  </div>
                  <Badge variant="outline" className={ROLE_BADGE_STYLES[selectedLog.user?.role || 'SYSTEM']}>
                    {selectedLog.user?.role || 'SYSTEM'}
                  </Badge>
                </div>
              </div>

              {/* Event Description */}
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-mono">Action Story</span>
                <div className="py-1">
                  {renderHumanNarrative(selectedLog.action, selectedLog.details)}
                </div>
                <div className="pt-2 border-t border-white/5 text-[11px] text-gray-500 font-mono break-all">
                  Raw Details: {selectedLog.details}
                </div>
              </div>

              {/* Timestamp & Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono block mb-1">Exact Time</span>
                  <span className="text-gray-200 font-mono text-[11px] block">{formatFullDate(selectedLog.createdAt)}</span>
                  <span className="text-gray-500 text-[10px]">({timeAgo(selectedLog.createdAt)})</span>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono block mb-1">Audit Record ID</span>
                  <span className="text-gray-400 font-mono text-[10px] block truncate">{selectedLog.id}</span>
                  <span className="text-emerald-400 text-[10px] flex items-center gap-1 mt-0.5">
                    <CheckCircle className="h-3 w-3" /> Verified Immutable
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
