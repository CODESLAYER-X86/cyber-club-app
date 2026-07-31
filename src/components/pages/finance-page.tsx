'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Loader2, Wallet, Receipt, Plus, CheckCircle, XCircle,
  Eye, ChevronRight, Activity, Landmark, CreditCard,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { TreasuryDeposit, Expense, ExpenseItem, TreasuryDepositSource } from '@/types';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/* ─── Deposit Source Labels ─── */
const DEPOSIT_SOURCE_LABELS: Record<string, string> = {
  UNIVERSITY_FUND: 'University Fund',
  SPONSOR: 'Sponsor',
  EVENT_REGISTRATION: 'Event Registration',
  MEMBERSHIP_REGISTRATION: 'Membership Registration',
  DONATION: 'Donation',
  OTHER: 'Other',
};

/* ─── Status Badge Config ─── */
const STATUS_CONFIG: Record<string, { color: string; dotColor: string; label: string }> = {
  PENDING: { color: 'text-amber-400', dotColor: 'bg-amber-400', label: 'Pending' },
  APPROVED: { color: 'text-emerald-400', dotColor: 'bg-emerald-400', label: 'Approved' },
  REJECTED: { color: 'text-red-400', dotColor: 'bg-red-400', label: 'Rejected' },
};

/* ─── Tab Type ─── */
type FinanceTab = 'overview' | 'deposits' | 'expenses';

/* ─── Activity Feed Item ─── */
interface ActivityItem {
  id: string;
  type: 'deposit' | 'expense';
  date: string;
  description: string;
  amount: number;
  status: string;
  source?: string;
}

/* ─── Status Badge Component ─── */
function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <Badge
      variant="outline"
      className={`border-transparent ${
        status === 'APPROVED'
          ? 'bg-emerald-500/15 text-emerald-400'
          : status === 'REJECTED'
          ? 'bg-red-500/15 text-red-400'
          : 'bg-amber-500/15 text-amber-400'
      }`}
    >
      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </Badge>
  );
}

/* ─── Format Currency ─── */
function formatTaka(amount: number): string {
  return `৳${amount.toLocaleString()}`;
}

/* ─── Format Date ─── */
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/* ─── Main Component ─── */
export function FinancePage() {
  const { currentUser, setCurrentView } = useAppStore();

  /* ─── State ─── */
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFunds: 0,
    totalDeposits: 0,
    totalExpenses: 0,
  });
  const [deposits, setDeposits] = useState<TreasuryDeposit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [depositForm, setDepositForm] = useState({
    date: '',
    amount: '',
    source: 'EVENT_REGISTRATION' as TreasuryDepositSource,
    note: '',
    attachmentUrl: '',
  });
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [approvingDepositId, setApprovingDepositId] = useState<string | null>(null);
  const [approvingExpenseId, setApprovingExpenseId] = useState<string | null>(null);

  /* ─── Role Checks ─── */
  const canSubmitDeposit = currentUser && ['TREASURER', 'PLATFORM_ADMIN'].includes(currentUser.role);
  const canApprove = currentUser && ['PRESIDENT', 'GS', 'PLATFORM_ADMIN'].includes(currentUser.role);

  /* ─── Data Fetching ─── */
  const loadData = async () => {
    try {
      const [statsRes, depositsRes, expensesRes] = await Promise.all([
        fetch('/api/stats').then((r) => r.json()),
        fetch('/api/treasury/deposits').then((r) => r.json()),
        fetch('/api/expenses').then((r) => r.json()),
      ]);

      if (statsRes.success && statsRes.data) {
        const s = statsRes.data.stats || statsRes.data;
        setStats({
          totalFunds: s.totalFunds ?? 0,
          totalDeposits: s.totalDeposits ?? 0,
          totalExpenses: s.totalExpenses ?? 0,
        });
      }

      if (depositsRes.success) {
        setDeposits(depositsRes.data.deposits || []);
      }

      if (expensesRes.success) {
        setExpenses(expensesRes.data.expenses || []);
      }
    } catch {
      // Silently keep fallback state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ─── Computed Values ─── */
  const approvedDepositsTotal = useMemo(
    () => deposits.filter((d) => d.status === 'APPROVED').reduce((sum, d) => sum + d.amount, 0),
    [deposits]
  );

  const approvedExpensesTotal = useMemo(
    () => expenses.filter((e) => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const currentBalance = useMemo(
    () => approvedDepositsTotal - approvedExpensesTotal,
    [approvedDepositsTotal, approvedExpensesTotal]
  );

  /* ─── Recent Activity Feed ─── */
  const recentActivity = useMemo<ActivityItem[]>(() => {
    const depositItems: ActivityItem[] = deposits.map((d) => ({
      id: d.id,
      type: 'deposit' as const,
      date: d.createdAt,
      description: DEPOSIT_SOURCE_LABELS[d.source] || d.source,
      amount: d.amount,
      status: d.status,
      source: d.source,
    }));

    const expenseItems: ActivityItem[] = expenses.map((e) => ({
      id: e.id,
      type: 'expense' as const,
      date: e.createdAt,
      description: e.title || 'Expense',
      amount: e.amount,
      status: e.status,
    }));

    return [...depositItems, ...expenseItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [deposits, expenses]);

  /* ─── Deposit Form Submit ─── */
  const handleDepositSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;

    setSubmittingDeposit(true);
    try {
      const response = await fetch('/api/treasury/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: depositForm.date,
          amount: Number(depositForm.amount),
          source: depositForm.source,
          note: depositForm.note || undefined,
          attachmentUrl: depositForm.attachmentUrl || undefined,
        }),
      });

      const payload = await response.json();
      if (payload.success) {
        setDepositForm({
          date: '',
          amount: '',
          source: 'EVENT_REGISTRATION',
          note: '',
          attachmentUrl: '',
        });
        await loadData();
      }
    } finally {
      setSubmittingDeposit(false);
    }
  };

  /* ─── Deposit Approval ─── */
  const handleDepositApproval = async (
    depositId: string,
    approverRole: 'PRESIDENT' | 'GS',
    status: 'APPROVED' | 'REJECTED'
  ) => {
    if (!currentUser) return;
    const confirmed = window.confirm(
      `Are you sure you want to ${status === 'APPROVED' ? 'approve' : 'reject'} this deposit as ${approverRole === 'PRESIDENT' ? 'President' : 'General Secretary'}?`
    );
    if (!confirmed) return;

    setApprovingDepositId(depositId);
    try {
      const response = await fetch(`/api/treasury/deposits/${depositId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverRole, status }),
      });
      const payload = await response.json();
      if (payload.success) {
        await loadData();
      }
    } finally {
      setApprovingDepositId(null);
    }
  };

  /* ─── Expense Approval ─── */
  const handleExpenseApproval = async (
    expenseId: string,
    approverRole: 'PRESIDENT' | 'GS',
    status: 'APPROVED' | 'REJECTED'
  ) => {
    if (!currentUser) return;
    const confirmed = window.confirm(
      `Are you sure you want to ${status === 'APPROVED' ? 'approve' : 'reject'} this expense as ${approverRole === 'PRESIDENT' ? 'President' : 'General Secretary'}?`
    );
    if (!confirmed) return;

    setApprovingExpenseId(expenseId);
    try {
      const response = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverRole, status }),
      });
      const payload = await response.json();
      if (payload.success) {
        await loadData();
      }
    } finally {
      setApprovingExpenseId(null);
    }
  };

  /* ─── Get Items Display String ─── */
  const getItemsDisplay = (items?: ExpenseItem[]): string => {
    if (!items || items.length === 0) return '—';
    return items.map((item) => `${item.itemName} (${item.quantity} ${item.unit})`).join(', ');
  };

  /* ─── Tab Config ─── */
  const tabs: { key: FinanceTab; label: string; icon: typeof DollarSign }[] = [
    { key: 'overview', label: 'Overview', icon: Eye },
    { key: 'deposits', label: 'Deposits', icon: Landmark },
    { key: 'expenses', label: 'Expenses', icon: Receipt },
  ];

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-gray-400">Loading treasury data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Gradient Header Banner ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/15 to-emerald-600/10 border border-emerald-500/10 p-6"
      >
        {/* SVG Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Treasury Management</h1>
              <p className="text-sm text-gray-400">Club Finance & Transparency Dashboard</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Tab Navigation ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex gap-2"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                  : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: OVERVIEW
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Summary Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={Wallet}
              label="Current Balance"
              value={formatTaka(currentBalance)}
              trend={currentBalance >= 0 ? 'up' : 'down'}
              delay={0}
            />
            <StatCard
              icon={ArrowUpRight}
              label="Total Deposits"
              value={formatTaka(approvedDepositsTotal)}
              trend="up"
              delay={0.1}
            />
            <StatCard
              icon={ArrowDownRight}
              label="Total Expenses"
              value={formatTaka(approvedExpensesTotal)}
              trend="down"
              delay={0.2}
            />
          </div>

          {/* Recent Activity Feed */}
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
                <CardTitle className="text-white text-sm">Recent Activity</CardTitle>
              </div>
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 text-[10px]">
                Last 5
              </Badge>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {recentActivity.map((activity, i) => {
                    const isDeposit = activity.type === 'deposit';
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            isDeposit
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {activity.description}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {isDeposit ? 'Deposit' : 'Expense'} •{' '}
                            {formatDate(activity.date)}
                          </p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <p
                            className={`text-sm font-semibold ${
                              isDeposit ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {isDeposit ? '+' : '-'}
                            {formatTaka(activity.amount)}
                          </p>
                          <StatusBadge status={activity.status} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Activity className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                  <p className="text-sm">No recent activity to display</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Navigation */}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => setActiveTab('deposits')}
              variant="outline"
              className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Landmark className="mr-2 h-4 w-4" />
              View Deposits
            </Button>
            <Button
              onClick={() => setActiveTab('expenses')}
              variant="outline"
              className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Receipt className="mr-2 h-4 w-4" />
              View Expenses
            </Button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: DEPOSITS
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'deposits' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Deposit Form — Only for TREASURER / PLATFORM_ADMIN */}
          {canSubmitDeposit && (
            <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-emerald-400" />
                  Record Deposit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDepositSubmit} className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-gray-400">Date</Label>
                      <Input
                        type="date"
                        value={depositForm.date}
                        onChange={(e) =>
                          setDepositForm((prev) => ({ ...prev, date: e.target.value }))
                        }
                        className="border-white/10 bg-white/5 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400">Amount (৳)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={depositForm.amount}
                        onChange={(e) =>
                          setDepositForm((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        className="border-white/10 bg-white/5 text-white"
                        placeholder="Enter amount"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">Source</Label>
                    <Select
                      value={depositForm.source}
                      onValueChange={(value) =>
                        setDepositForm((prev) => ({
                          ...prev,
                          source: value as TreasuryDepositSource,
                        }))
                      }
                    >
                      <SelectTrigger className="border-white/10 bg-white/5 text-white">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#1a1a2e]">
                        {Object.entries(DEPOSIT_SOURCE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">Note</Label>
                    <Textarea
                      value={depositForm.note}
                      onChange={(e) =>
                        setDepositForm((prev) => ({ ...prev, note: e.target.value }))
                      }
                      rows={3}
                      className="border-white/10 bg-white/5 text-white"
                      placeholder="Optional note"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">Attachment URL (Optional)</Label>
                    <Input
                      value={depositForm.attachmentUrl}
                      onChange={(e) =>
                        setDepositForm((prev) => ({
                          ...prev,
                          attachmentUrl: e.target.value,
                        }))
                      }
                      className="border-white/10 bg-white/5 text-white"
                      placeholder="Optional proof link"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-emerald-600 text-white hover:bg-emerald-500"
                    disabled={submittingDeposit}
                  >
                    {submittingDeposit ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Submit for Approval
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Deposit History Table */}
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Landmark className="h-4 w-4 text-emerald-400" />
                Deposit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deposits.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Landmark className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                  <p className="text-sm">No deposits recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-left">
                        <th className="pb-3 pr-4 text-gray-500 font-medium">Date</th>
                        <th className="pb-3 pr-4 text-gray-500 font-medium">Source</th>
                        <th className="pb-3 pr-4 text-gray-500 font-medium">Amount</th>
                        <th className="pb-3 pr-4 text-gray-500 font-medium">Submitted By</th>
                        <th className="pb-3 pr-4 text-gray-500 font-medium">Status</th>
                        {canApprove && (
                          <th className="pb-3 pr-4 text-gray-500 font-medium">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map((deposit, i) => (
                        <motion.tr
                          key={deposit.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">
                            {formatDate(deposit.date)}
                          </td>
                          <td className="py-3 pr-4 text-white whitespace-nowrap">
                            {DEPOSIT_SOURCE_LABELS[deposit.source] || deposit.source}
                          </td>
                          <td className="py-3 pr-4 text-emerald-400 font-semibold whitespace-nowrap">
                            {formatTaka(deposit.amount)}
                          </td>
                          <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">
                            {deposit.submitter?.name || '—'}
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap">
                            <StatusBadge status={deposit.status} />
                          </td>
                          {canApprove && (
                            <td className="py-3 pr-4">
                              {deposit.status !== 'APPROVED' &&
                              deposit.status !== 'REJECTED' ? (
                                <div className="flex flex-wrap gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 h-7 text-[11px] px-2"
                                    onClick={() =>
                                      handleDepositApproval(
                                        deposit.id,
                                        'PRESIDENT',
                                        'APPROVED'
                                      )
                                    }
                                    disabled={approvingDepositId === deposit.id}
                                  >
                                    {approvingDepositId === deposit.id ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                    )}
                                    President Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-7 text-[11px] px-2"
                                    onClick={() =>
                                      handleDepositApproval(
                                        deposit.id,
                                        'PRESIDENT',
                                        'REJECTED'
                                      )
                                    }
                                    disabled={approvingDepositId === deposit.id}
                                  >
                                    <XCircle className="mr-1 h-3 w-3" />
                                    President Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 h-7 text-[11px] px-2"
                                    onClick={() =>
                                      handleDepositApproval(deposit.id, 'GS', 'APPROVED')
                                    }
                                    disabled={approvingDepositId === deposit.id}
                                  >
                                    {approvingDepositId === deposit.id ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                    )}
                                    GS Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-7 text-[11px] px-2"
                                    onClick={() =>
                                      handleDepositApproval(deposit.id, 'GS', 'REJECTED')
                                    }
                                    disabled={approvingDepositId === deposit.id}
                                  >
                                    <XCircle className="mr-1 h-3 w-3" />
                                    GS Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-gray-600 text-xs">—</span>
                              )}
                            </td>
                          )}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: EXPENSES
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'expenses' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Receipt className="h-4 w-4 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Expense History</h2>
            </div>
            <Button
              onClick={() => setCurrentView('expenses')}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>

          {/* Expense History Table */}
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardContent className="pt-6">
              {expenses.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Receipt className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                  <p className="text-sm">No expenses recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-left">
                        <th className="pb-3 pr-4 text-gray-500 font-medium">Date</th>
                        <th className="pb-3 pr-4 text-gray-500 font-medium">Items</th>
                        <th className="pb-3 pr-4 text-gray-500 font-medium">Total (৳)</th>
                        <th className="pb-3 pr-4 text-gray-500 font-medium">Purchased By</th>
                        <th className="pb-3 pr-4 text-gray-500 font-medium">Status</th>
                        {canApprove && (
                          <th className="pb-3 pr-4 text-gray-500 font-medium">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense, i) => (
                        <motion.tr
                          key={expense.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">
                            {formatDate(expense.date)}
                          </td>
                          <td className="py-3 pr-4 text-gray-300 max-w-[250px] truncate">
                            {getItemsDisplay(expense.items)}
                          </td>
                          <td className="py-3 pr-4 text-red-400 font-semibold whitespace-nowrap">
                            {formatTaka(expense.amount)}
                          </td>
                          <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">
                            {expense.creator?.name || expense.purchasedBy || '—'}
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap">
                            <StatusBadge status={expense.status} />
                          </td>
                          {canApprove && (
                            <td className="py-3 pr-4">
                              {expense.status !== 'APPROVED' &&
                              expense.status !== 'REJECTED' ? (
                                <div className="flex flex-wrap gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 h-7 text-[11px] px-2"
                                    onClick={() =>
                                      handleExpenseApproval(
                                        expense.id,
                                        'PRESIDENT',
                                        'APPROVED'
                                      )
                                    }
                                    disabled={approvingExpenseId === expense.id}
                                  >
                                    {approvingExpenseId === expense.id ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                    )}
                                    President Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-7 text-[11px] px-2"
                                    onClick={() =>
                                      handleExpenseApproval(
                                        expense.id,
                                        'PRESIDENT',
                                        'REJECTED'
                                      )
                                    }
                                    disabled={approvingExpenseId === expense.id}
                                  >
                                    <XCircle className="mr-1 h-3 w-3" />
                                    President Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 h-7 text-[11px] px-2"
                                    onClick={() =>
                                      handleExpenseApproval(expense.id, 'GS', 'APPROVED')
                                    }
                                    disabled={approvingExpenseId === expense.id}
                                  >
                                    {approvingExpenseId === expense.id ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                    )}
                                    GS Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-7 text-[11px] px-2"
                                    onClick={() =>
                                      handleExpenseApproval(expense.id, 'GS', 'REJECTED')
                                    }
                                    disabled={approvingExpenseId === expense.id}
                                  >
                                    <XCircle className="mr-1 h-3 w-3" />
                                    GS Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-gray-600 text-xs">—</span>
                              )}
                            </td>
                          )}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
