'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Loader2, Wallet, Activity, Landmark, Receipt, Eye, ExternalLink,
  ShieldCheck, Calendar, User, FileText, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Package
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { sanitizeUrl } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

/* ─── Status Badge Config ─── */
const STATUS_CONFIG: Record<string, { color: string; dotColor: string; bg: string; label: string }> = {
  PENDING: { color: 'text-amber-400', dotColor: 'bg-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Pending' },
  APPROVED: { color: 'text-emerald-400', dotColor: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Approved' },
  REJECTED: { color: 'text-red-400', dotColor: 'bg-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Rejected' },
  VOIDED: { color: 'text-rose-400', dotColor: 'bg-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', label: 'Voided' },
};

const DEPOSIT_SOURCE_LABELS: Record<string, string> = {
  UNIVERSITY_FUND: 'University Fund',
  SPONSOR: 'Sponsor',
  EVENT_REGISTRATION: 'Event Registration',
  MEMBERSHIP_FEE: 'Membership Fee',
  DONATION: 'Donation',
  OTHER: 'Other',
};

/* ─── Activity Feed Item ─── */
interface ActivityItem {
  id: string;
  type: 'deposit' | 'expense';
  description: string;
  amount: number;
  status: string;
  createdAt: string;
  source?: string;
  note?: string;
  raw: any;
}

export function FinancePage() {
  const { currentUser, setCurrentView } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [recentDeposits, setRecentDeposits] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ActivityItem | null>(null);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<'all' | 'expense' | 'deposit'>('all');

  const isExecutive = currentUser && ['PRESIDENT', 'GS', 'TREASURER', 'PLATFORM_ADMIN', 'VP'].includes(currentUser.role);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, depositsRes, expensesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/treasury/deposits'),
        fetch('/api/expenses'),
      ]);

      const statsData = await statsRes.json();
      const depositsData = await depositsRes.json();
      const expensesData = await expensesRes.json();

      if (statsData.success) setStats(statsData.data.stats);
      if (depositsData.success) setRecentDeposits(depositsData.data.deposits || []);
      if (expensesData.success) setRecentExpenses(expensesData.data.expenses || []);
    } catch (e) {
      console.error('[FinancePage] Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const currentBalance = stats?.currentBalance ?? stats?.totalFunds ?? 0;
  const totalDeposits = stats?.totalDeposits ?? 0;
  const totalExpenses = stats?.totalExpenses ?? 0;
  const pendingDeposits = stats?.pendingDepositsCount ?? 0;
  const pendingExpenses = stats?.pendingExpensesCount ?? 0;

  // Merge activity with full underlying raw details
  const allActivities: ActivityItem[] = [
    ...recentDeposits.map((d: any) => ({
      id: d.id,
      type: 'deposit' as const,
      description: `${DEPOSIT_SOURCE_LABELS[d.source] || d.source} deposit`,
      amount: d.amount,
      status: d.status,
      createdAt: d.createdAt,
      source: d.source,
      note: d.note,
      raw: d,
    })),
    ...recentExpenses.map((e: any) => ({
      id: e.id,
      type: 'expense' as const,
      description: e.note || 'Expense',
      amount: e.amount,
      status: e.status,
      createdAt: e.createdAt,
      note: e.note,
      raw: e,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredActivities = allActivities.filter((item) => {
    if (activityFilter === 'all') return true;
    return item.type === activityFilter;
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gradient Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/15 to-emerald-600/10 border border-emerald-500/10 p-6"
      >
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <Landmark className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Treasury Management</h1>
              <p className="text-sm text-gray-400">Public financial transparency, deposits, and expense auditing</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs hidden sm:inline-flex">
            Open Ledger Transparency
          </Badge>
        </div>
      </motion.div>

      {/* 3 Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <StatCard
            label="Current Balance"
            value={`৳${currentBalance.toLocaleString()}`}
            icon={Wallet}
            trend={currentBalance >= 0 ? 'up' : 'down'}
            trendLabel="Approved Deposits − Approved Expenses"
            className="border-emerald-500/10"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <StatCard
            label="Total Deposits"
            value={`৳${totalDeposits.toLocaleString()}`}
            icon={TrendingUp}
            trend="up"
            trendLabel={`${pendingDeposits} pending approval`}
            className="border-cyan-500/10"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <StatCard
            label="Total Expenses"
            value={`৳${totalExpenses.toLocaleString()}`}
            icon={TrendingDown}
            trend="down"
            trendLabel={`${pendingExpenses} pending approval`}
            className="border-amber-500/10"
          />
        </motion.div>
      </div>

      {/* Navigation Cards — Available to Executives to Manage Ledgers */}
      {isExecutive && (
        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Card
              className="border-white/5 bg-[#111]/60 backdrop-blur cursor-pointer hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group"
              onClick={() => setCurrentView('deposits')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                      <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        Manage Deposits
                      </h3>
                      <p className="text-xs text-gray-400">
                        Record and approve income entries
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card
              className="border-white/5 bg-[#111]/60 backdrop-blur cursor-pointer hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all group"
              onClick={() => setCurrentView('expenses')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                      <ArrowDownRight className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                        Manage Expenses
                      </h3>
                      <p className="text-xs text-gray-400">
                        Record, audit, and approve expense vouchers
                      </p>
                    </div>
                  </div>
                  <ArrowDownRight className="h-5 w-5 text-gray-600 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-all" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Treasury Activity List with Clickable Expandable Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Activity className="h-5 w-5 text-emerald-400" />
                Treasury Activity
              </CardTitle>
              <span className="text-xs text-gray-400">Click any transaction to expand and inspect purchased items & details</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5 self-start sm:self-auto">
              <Button
                variant={activityFilter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActivityFilter('all')}
                className={`h-7 px-2.5 text-xs ${activityFilter === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                All ({allActivities.length})
              </Button>
              <Button
                variant={activityFilter === 'expense' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActivityFilter('expense')}
                className={`h-7 px-2.5 text-xs ${activityFilter === 'expense' ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:text-amber-400'}`}
              >
                Expenses ({allActivities.filter((a) => a.type === 'expense').length})
              </Button>
              <Button
                variant={activityFilter === 'deposit' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActivityFilter('deposit')}
                className={`h-7 px-2.5 text-xs ${activityFilter === 'deposit' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-400 hover:text-emerald-400'}`}
              >
                Deposits ({allActivities.filter((a) => a.type === 'deposit').length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredActivities.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">No treasury activity found for this filter</p>
            ) : (
              <div className="space-y-2.5">
                {filteredActivities.map((item) => {
                  const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
                  const isDeposit = item.type === 'deposit';
                  const isExpanded = expandedActivityId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-white/5 bg-white/[0.02] transition-all hover:border-emerald-500/20 overflow-hidden"
                    >
                      <div
                        onClick={() => setExpandedActivityId(isExpanded ? null : item.id)}
                        className="group flex items-center justify-between p-3.5 cursor-pointer hover:bg-white/[0.03] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${isDeposit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                            {isDeposit ? <ArrowUpRight className="h-4.5 w-4.5" /> : <ArrowDownRight className="h-4.5 w-4.5" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">
                              {item.description}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                              <span>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              {item.type === 'expense' && item.raw?.purchasedBy && (
                                <span>• By {item.raw.purchasedBy}</span>
                              )}
                              {item.type === 'expense' && Array.isArray(item.raw?.items) && item.raw.items.length > 0 && (
                                <span className="text-[11px] text-amber-400/80 font-mono">({item.raw.items.length} item{item.raw.items.length > 1 ? 's' : ''})</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-semibold font-mono ${isDeposit ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isDeposit ? '+' : '−'}৳{item.amount.toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full ${statusConf.dotColor}`} />
                            <span className={`text-xs ${statusConf.color}`}>{statusConf.label}</span>
                          </div>
                          <div className="text-gray-500 group-hover:text-emerald-400 transition-colors p-1">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Accordion Section */}
                      {isExpanded && (
                        <div className="border-t border-white/5 p-4 space-y-3.5 bg-black/35 text-xs">
                          {/* Purchased Products Breakdown */}
                          {item.type === 'expense' && Array.isArray(item.raw.items) && item.raw.items.length > 0 ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                                <span className="flex items-center gap-1.5">
                                  <Package className="h-3.5 w-3.5" /> Purchased Products & Items ({item.raw.items.length}):
                                </span>
                                <span className="text-[11px] font-mono text-gray-400">Total: ৳{item.amount.toLocaleString()}</span>
                              </div>
                              <div className="rounded-md border border-white/10 bg-black/40 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                  <thead className="bg-white/5 text-gray-400 font-medium text-[11px]">
                                    <tr>
                                      <th className="py-2 px-3">Product / Item</th>
                                      <th className="py-2 px-3 text-center">Qty & Unit</th>
                                      <th className="py-2 px-3 text-right">Unit Price</th>
                                      <th className="py-2 px-3 text-right">Total Cost</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.raw.items.map((it: any, idx: number) => (
                                      <tr key={idx} className="border-t border-white/5 text-gray-300 hover:bg-white/[0.02]">
                                        <td className="py-2 px-3 text-white font-medium">{it.itemName}</td>
                                        <td className="py-2 px-3 text-center text-gray-400">{it.quantity} {it.unit}</td>
                                        <td className="py-2 px-3 text-right font-mono text-gray-400">৳{Number(it.price).toLocaleString()}</td>
                                        <td className="py-2 px-3 text-right font-mono font-semibold text-amber-300">৳{(it.quantity * it.price).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : item.type === 'expense' ? (
                            <div className="rounded-md border border-white/5 bg-white/[0.02] p-2.5 text-xs flex justify-between items-center text-gray-300">
                              <span>Operational expense: <span className="text-white font-medium">{item.description}</span></span>
                              <span className="font-mono font-bold text-amber-400">৳{item.amount.toLocaleString()}</span>
                            </div>
                          ) : (
                            <div className="rounded-md border border-white/5 bg-white/[0.02] p-2.5 text-xs flex justify-between items-center text-gray-300">
                              <span>Deposit Source: <span className="text-white font-medium">{DEPOSIT_SOURCE_LABELS[item.raw.source] || item.raw.source || 'Club Funds'}</span></span>
                              <span className="font-mono font-bold text-emerald-400">+৳{item.amount.toLocaleString()}</span>
                            </div>
                          )}

                          {/* Note / Memo */}
                          {item.raw.note && (
                            <div className="p-2.5 rounded-md bg-white/[0.02] border border-white/5 text-gray-300">
                              <span className="text-gray-500 block text-[10px] uppercase font-semibold mb-0.5">Purpose / Memo:</span>
                              <p className="leading-relaxed">{item.raw.note}</p>
                            </div>
                          )}

                          {/* Submitter, Purchaser & Approvals */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-400 bg-white/[0.02] border border-white/5 p-3 rounded-lg">
                            <div>
                              <span className="text-gray-500">Recorded By: </span>
                              <span className="text-gray-300 font-medium">{item.raw.creator?.name || item.raw.submitter?.name || 'Treasurer'}</span>
                            </div>
                            {item.raw.purchasedBy && (
                              <div>
                                <span className="text-gray-500">Purchased By: </span>
                                <span className="text-emerald-400 font-medium">{item.raw.purchasedBy}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">President Verification: </span>
                              <span className={item.raw.presidentStatus === 'APPROVED' ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                                {item.raw.presidentStatus || (item.status === 'APPROVED' ? 'Verified' : 'Pending')}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">General Secretary Verification: </span>
                              <span className={item.raw.gsStatus === 'APPROVED' ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                                {item.raw.gsStatus || (item.status === 'APPROVED' ? 'Verified' : 'Pending')}
                              </span>
                            </div>
                          </div>

                          {/* Attachment Link & Modal trigger */}
                          <div className="flex items-center justify-between pt-1">
                            {item.raw.attachmentUrl ? (
                              <a
                                href={sanitizeUrl(item.raw.attachmentUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> View Receipt Document
                              </a>
                            ) : <div />}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                              }}
                              className="h-7 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Full Details Dialog
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Transparent Transaction Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="border-white/10 bg-[#0f1715] text-white max-w-lg p-6">
          {selectedItem && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={selectedItem.type === 'deposit' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/30 text-amber-400 bg-amber-500/10'}>
                    {selectedItem.type === 'deposit' ? 'Deposit Entry' : 'Expense Voucher'}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${STATUS_CONFIG[selectedItem.status]?.dotColor || 'bg-gray-400'}`} />
                    <span className={`text-xs font-semibold ${STATUS_CONFIG[selectedItem.status]?.color || 'text-gray-400'}`}>
                      {STATUS_CONFIG[selectedItem.status]?.label || selectedItem.status}
                    </span>
                  </div>
                </div>
                <DialogTitle className="text-xl font-bold text-white pt-2">
                  {selectedItem.description}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-400">
                  Transaction Record ID: <span className="font-mono text-gray-300">{selectedItem.id}</span>
                </DialogDescription>
              </DialogHeader>

              {/* Amount Display */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${selectedItem.type === 'deposit' ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-amber-500/20 bg-amber-500/10'}`}>
                <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
                  {selectedItem.type === 'deposit' ? 'Total Inflow' : 'Total Outflow'}
                </span>
                <span className={`text-2xl font-bold font-mono ${selectedItem.type === 'deposit' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedItem.type === 'deposit' ? '+' : '−'}৳{selectedItem.amount.toLocaleString()}
                </span>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                <div>
                  <span className="text-gray-500 block mb-0.5">Date</span>
                  <span className="text-gray-200 font-medium">
                    {new Date(selectedItem.raw.date || selectedItem.createdAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Category / Source</span>
                  <span className="text-gray-200 font-medium">
                    {selectedItem.type === 'deposit'
                      ? (DEPOSIT_SOURCE_LABELS[selectedItem.raw.source] || selectedItem.raw.source)
                      : (selectedItem.raw.category || 'General Club Operations')}
                  </span>
                </div>
                {selectedItem.raw.purchasedBy && (
                  <div>
                    <span className="text-gray-500 block mb-0.5">Purchaser</span>
                    <span className="text-gray-200 font-medium">{selectedItem.raw.purchasedBy}</span>
                  </div>
                )}
                {selectedItem.raw.submitter?.name && (
                  <div>
                    <span className="text-gray-500 block mb-0.5">Recorded By</span>
                    <span className="text-gray-200 font-medium">{selectedItem.raw.submitter.name} ({selectedItem.raw.submitter.role})</span>
                  </div>
                )}
                {selectedItem.raw.creator?.name && (
                  <div>
                    <span className="text-gray-500 block mb-0.5">Submitted By</span>
                    <span className="text-gray-200 font-medium">{selectedItem.raw.creator.name} ({selectedItem.raw.creator.role})</span>
                  </div>
                )}
              </div>

              {/* Notes / Description */}
              {selectedItem.raw.note && (
                <div className="space-y-1 text-xs">
                  <span className="text-gray-400 font-semibold block">Memo / Purpose:</span>
                  <p className="text-gray-300 bg-white/[0.02] p-3 rounded-lg border border-white/5 leading-relaxed">
                    {selectedItem.raw.note}
                  </p>
                </div>
              )}

              {/* Itemized breakdown for expenses */}
              {selectedItem.type === 'expense' && Array.isArray(selectedItem.raw.items) && selectedItem.raw.items.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-gray-400 font-semibold block">Itemized Breakdown:</span>
                  <div className="border border-white/5 rounded-lg overflow-hidden text-xs">
                    <div className="bg-white/5 p-2 grid grid-cols-12 text-gray-400 font-semibold">
                      <span className="col-span-6">Item</span>
                      <span className="col-span-3 text-right">Qty & Unit</span>
                      <span className="col-span-3 text-right">Cost</span>
                    </div>
                    {selectedItem.raw.items.map((it: any, idx: number) => (
                      <div key={idx} className="p-2 grid grid-cols-12 border-t border-white/5 text-gray-300">
                        <span className="col-span-6 font-medium text-white">{it.itemName}</span>
                        <span className="col-span-3 text-right text-gray-400">{it.quantity} {it.unit}</span>
                        <span className="col-span-3 text-right font-mono">৳{(it.quantity * it.price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification & Approvals Sign-off */}
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-1.5 text-xs">
                <span className="text-gray-400 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Executive Approvals Sign-off
                </span>
                <div className="grid grid-cols-2 gap-2 pt-1 text-gray-300">
                  <div>
                    <span className="text-gray-500 block">President Review</span>
                    <span>{selectedItem.raw.presidentApprover?.name || (selectedItem.status === 'APPROVED' ? 'Verified' : 'Pending')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">GS Review</span>
                    <span>{selectedItem.raw.gsApprover?.name || (selectedItem.status === 'APPROVED' ? 'Verified' : 'Pending')}</span>
                  </div>
                </div>
              </div>

              {/* Receipt / Voucher Attachment */}
              {selectedItem.raw.attachmentUrl && (
                <div className="pt-1">
                  <a
                    href={sanitizeUrl(selectedItem.raw.attachmentUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View Receipt / Supporting Voucher Document
                  </a>
                </div>
              )}

              {/* Footer action */}
              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedItem(null)}
                  className="border-white/10 text-white hover:bg-white/10 text-xs h-8"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
