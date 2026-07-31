'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Loader2, Wallet, Activity, Landmark, Receipt,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/* ─── Status Badge Config ─── */
const STATUS_CONFIG: Record<string, { color: string; dotColor: string; label: string }> = {
  PENDING: { color: 'text-amber-400', dotColor: 'bg-amber-400', label: 'Pending' },
  APPROVED: { color: 'text-emerald-400', dotColor: 'bg-emerald-400', label: 'Approved' },
  REJECTED: { color: 'text-red-400', dotColor: 'bg-red-400', label: 'Rejected' },
};

const DEPOSIT_SOURCE_LABELS: Record<string, string> = {
  UNIVERSITY_FUND: 'University Fund',
  SPONSOR: 'Sponsor',
  EVENT_REGISTRATION: 'Event Reg.',
  MEMBERSHIP_REGISTRATION: 'Membership Reg.',
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
}

export function FinancePage() {
  const { currentUser, setCurrentView } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [recentDeposits, setRecentDeposits] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      if (depositsData.success) setRecentDeposits((depositsData.data.deposits || []).slice(0, 5));
      if (expensesData.success) setRecentExpenses((expensesData.data.expenses || []).slice(0, 5));
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

  // Merge recent activity
  const recentActivity: ActivityItem[] = [
    ...recentDeposits.map((d: any) => ({
      id: d.id,
      type: 'deposit' as const,
      description: `${DEPOSIT_SOURCE_LABELS[d.source] || d.source} deposit`,
      amount: d.amount,
      status: d.status,
      createdAt: d.createdAt,
      source: d.source,
    })),
    ...recentExpenses.map((e: any) => ({
      id: e.id,
      type: 'expense' as const,
      description: e.note || 'Expense',
      amount: e.amount,
      status: e.status,
      createdAt: e.createdAt,
      note: e.note,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

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
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
            <Landmark className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Treasury Management</h1>
            <p className="text-sm text-gray-400">Track deposits, expenses, and current balance</p>
          </div>
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

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card
            className="border-white/5 bg-[#111]/60 backdrop-blur cursor-pointer hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5 transition-all"
            onClick={() => setCurrentView('deposits')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Manage Deposits</h3>
                    <p className="text-xs text-gray-400">Record and approve income entries</p>
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-600" />
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
            className="border-white/5 bg-[#111]/60 backdrop-blur cursor-pointer hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5 transition-all"
            onClick={() => setCurrentView('expenses')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <ArrowDownRight className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Manage Expenses</h3>
                    <p className="text-xs text-gray-400">Record and approve expense entries</p>
                  </div>
                </div>
                <ArrowDownRight className="h-5 w-5 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Activity className="h-5 w-5 text-emerald-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item) => {
                  const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
                  const isDeposit = item.type === 'deposit';
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isDeposit ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                          {isDeposit ? (
                            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{item.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold ${isDeposit ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isDeposit ? '+' : '−'}৳{item.amount.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${statusConf.dotColor}`} />
                          <span className={`text-xs ${statusConf.color}`}>{statusConf.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
