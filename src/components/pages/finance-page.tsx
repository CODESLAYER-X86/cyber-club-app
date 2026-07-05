'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Download, ArrowUpRight, ArrowDownRight, CircleDot, Loader2, Wallet, Receipt, CreditCard, Clock } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Payment } from '@/types';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { exportToCSV } from '@/lib/export-utils';

const PAYMENT_STATUS_CONFIG: Record<string, { color: string; dotColor: string; label: string }> = {
  VERIFIED: { color: 'text-emerald-400', dotColor: 'bg-emerald-400', label: 'Verified' },
  PENDING: { color: 'text-amber-400', dotColor: 'bg-amber-400', label: 'Pending' },
  REJECTED: { color: 'text-red-400', dotColor: 'bg-red-400', label: 'Rejected' },
};

const PAYMENT_TYPE_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  MEMBERSHIP_FEE: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: 'text-emerald-400', label: 'Membership' },
  EVENT_FEE: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: 'text-cyan-400', label: 'Event' },
  WORKSHOP_FEE: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: 'text-amber-400', label: 'Workshop' },
  DONATION: { color: 'text-violet-400', bg: 'bg-violet-500/10', icon: 'text-violet-400', label: 'Donation' },
  OTHER: { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: 'text-gray-400', label: 'Other' },
};

/* ─── Monthly Revenue Trend (generated from payments) ─── */
function generateMonthlyRevenue(payments: Payment[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const data: { month: string; revenue: number; }[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthIdx = (now.getMonth() - i + 12) % 12;
    const year = now.getMonth() - i < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const monthPayments = payments.filter(p => {
      const d = new Date(p.createdAt);
      return d.getMonth() === monthIdx && d.getFullYear() === year && p.status === 'VERIFIED' && p.type !== 'EVENT';
    });
    const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    data.push({ month: months[monthIdx], revenue });
  }

  return data;
}

export function FinancePage() {
  const { currentUser, setCurrentView } = useAppStore();
  const [stats, setStats] = useState({ totalMembers: 0, totalFunds: 0, activeEvents: 0, pendingApprovals: 0, totalCertificates: 0 });
  const [budgets, setBudgets] = useState<{ id: string; title: string; amount: number; status?: string; expenses: { amount: number; status: string }[] }[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [walletBalances, setWalletBalances] = useState<any>({ BKASH_PERSONAL: 0, NAGAD_PERSONAL: 0, CLUB_BANK_ACCOUNT: 0, CASH_IN_HAND: 0 });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/budgets').then(r => r.json()),
      fetch('/api/ledger').then(r => r.json()),
    ]).then(([statsData, budgetsData, ledgerData]) => {
      if (statsData.success && statsData.data) {
        const s = statsData.data.stats || statsData.data;
        setStats({
          totalMembers: s.totalMembers ?? 0,
          totalFunds: s.totalFunds ?? 0,
          activeEvents: s.activeEvents ?? 0,
          pendingApprovals: s.pendingApprovals ?? 0,
          totalCertificates: s.totalCertificates ?? 0,
        });
      }
      if (budgetsData.success) {
        setBudgets(budgetsData.data.budgets || []);
      }
      if (ledgerData.success && ledgerData.data) {
        setLedgerEntries(ledgerData.data.ledgerEntries || []);
        setWalletBalances(ledgerData.data.walletBalances || { BKASH_PERSONAL: 0, NAGAD_PERSONAL: 0, CLUB_BANK_ACCOUNT: 0, CASH_IN_HAND: 0 });
      }
    }).catch(() => {});
  }, []);

  const chartData = budgets.filter(b => b.status === 'APPROVED').map(b => ({
    name: b.title.length > 20 ? b.title.substring(0, 20) + '...' : b.title,
    Budget: b.amount,
    Spent: b.expenses?.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0) || 0,
  }));

  // Calculations for budget limits and spending
  const totalBudget = budgets.filter(b => b.status === 'APPROVED').reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.filter(b => b.status === 'APPROVED').reduce((sum, b) => sum + (b.expenses?.filter(e => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0) || 0), 0);
  const allocatedBudget = totalBudget - totalSpent;
  const availableFunds = stats.totalFunds - allocatedBudget;
  const utilizationPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // SVG donut parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (utilizationPercent / 100) * circumference;

  // Stat card progress calculations
  const fundsProgress = stats.totalFunds > 0 ? 100 : 0;
  const budgetProgress = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const availableProgress = stats.totalFunds > 0 ? Math.max(0, Math.round((availableFunds / stats.totalFunds) * 100)) : 0;
  const ledgerProgress = ledgerEntries.length > 0 ? 100 : 0;

  return (
    <div className="space-y-6">
      {/* Gradient Header Banner */}
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
              <h1 className="text-2xl font-bold text-white">Finance Overview</h1>
              <p className="text-sm text-gray-400">Club General Ledger & Transparency Board</p>
            </div>
          </div>
          {/* Export Button */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
              disabled={exporting}
              onClick={() => {
                setExporting(true);
                setTimeout(() => {
                  exportToCSV(
                    ledgerEntries.map(e => ({
                      Date: new Date(e.createdAt).toLocaleDateString(),
                      Description: e.description,
                      Type: e.type,
                      Amount: e.amount,
                      Wallet: e.wallet,
                      Operator: e.operator?.name || 'System',
                    })),
                    'ledger-export',
                    [
                      { key: 'Date', label: 'Date' },
                      { key: 'Description', label: 'Description' },
                      { key: 'Type', label: 'Type' },
                      { key: 'Amount', label: 'Amount' },
                      { key: 'Wallet', label: 'Wallet' },
                      { key: 'Operator', label: 'Operator' },
                    ]
                  );
                  setExporting(false);
                }, 300);
              }}
            >
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export CSV
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stat Cards with Progress Bars */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Net Treasury" value={`৳${stats.totalFunds.toLocaleString()}`} trend="up" delay={0} progress={fundsProgress} progressColor="#10b981" />
        <StatCard icon={BarChart3} label="Allocated Budget" value={`৳${allocatedBudget.toLocaleString()}`} trend="neutral" delay={0.1} progress={budgetProgress} progressColor="#06b6d4" />
        <StatCard icon={Clock} label="Available Funds" value={`৳${availableFunds.toLocaleString()}`} trend="up" delay={0.2} progress={availableProgress} progressColor="#f59e0b" />
        <StatCard icon={Receipt} label="Total Entries" value={ledgerEntries.length} trend="neutral" delay={0.3} progress={ledgerProgress} progressColor="#8b5cf6" />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart - 2 cols */}
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur lg:col-span-2">
          <CardHeader><CardTitle className="text-white">Budget vs Expenses</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Bar dataKey="Budget" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="py-12 text-center text-gray-500">No approved budget data available</p>}
          </CardContent>
        </Card>

        {/* Fund Utilization & Wallets - 1 col */}
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader><CardTitle className="text-white text-sm">Asset & Utilization</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-2">
            <div className="relative">
              <svg width="120" height="120" viewBox="0 0 140 140" className="-rotate-90">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <motion.circle
                  cx="70" cy="70" r={radius} fill="none"
                  stroke="url(#gradient)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">{utilizationPercent}%</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">Spent</span>
              </div>
            </div>

            <div className="mt-4 w-full space-y-2">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Asset Wallets</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Bank Account</span>
                <span className="text-white font-medium">৳{(walletBalances.CLUB_BANK_ACCOUNT || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">bKash Personal</span>
                <span className="text-white font-medium">৳{(walletBalances.BKASH_PERSONAL || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Nagad Personal</span>
                <span className="text-white font-medium">৳{(walletBalances.NAGAD_PERSONAL || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                <span className="text-gray-500">Cash in Hand</span>
                <span className="text-white font-medium">৳{(walletBalances.CASH_IN_HAND || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-400 font-semibold">Total Funds</span>
                <span className="text-emerald-400 font-bold">৳{stats.totalFunds.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* General Ledger (Audit Feed) */}
      <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Receipt className="h-4 w-4 text-emerald-400" />
            </div>
            <CardTitle className="text-white text-sm">General Ledger (Audit Feed)</CardTitle>
          </div>
          <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 text-[10px]">Reconciled</Badge>
        </CardHeader>
        <CardContent>
          {ledgerEntries.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {ledgerEntries.map((entry, i) => {
                const isCredit = entry.type === 'CREDIT';
                const walletName = entry.wallet === 'BKASH_PERSONAL' ? 'bKash' :
                             entry.wallet === 'NAGAD_PERSONAL' ? 'Nagad' :
                             entry.wallet === 'CLUB_BANK_ACCOUNT' ? 'Bank' : 'Cash';
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {isCredit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{entry.description}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Wallet: <span className="text-gray-400 font-semibold">{walletName}</span> • Operator: {entry.operator?.name || 'System'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isCredit ? '+' : '-'}৳{entry.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-600">{new Date(entry.createdAt).toLocaleDateString()}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <Receipt className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <p className="text-sm">No ledger entries posted yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budgets List with Double-Approval Status Badge */}
      {budgets.length > 0 && (
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-sm">Active & Pending Budgets</CardTitle>
            {currentUser && ['TREASURER', 'PRESIDENT', 'GS', 'PLATFORM_ADMIN'].includes(currentUser.role) && (
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('budgets')} className="text-emerald-400 hover:text-emerald-300 text-xs">
                Manage →
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgets.map((budget, i) => {
                const spent = budget.expenses?.filter(e => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0) || 0;
                const percent = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
                const isApproved = budget.status === 'APPROVED';
                const isRejected = budget.status === 'REJECTED';
                const barColor = percent > 90 ? '#ef4444' : percent > 70 ? '#f59e0b' : '#10b981';

                return (
                  <motion.div
                    key={budget.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-lg border border-white/5 bg-white/[0.01]"
                  >
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-medium truncate max-w-[200px]">{budget.title}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 h-4 border-transparent ${
                            isApproved ? 'bg-emerald-500/15 text-emerald-400' :
                            isRejected ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {budget.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">৳{spent.toLocaleString()} / ৳{budget.amount.toLocaleString()}</span>
                    </div>

                    {isApproved && (
                      <>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: barColor }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-gray-600">
                          <span>{percent}% utilized</span>
                          <span>৳{(budget.amount - spent).toLocaleString()} remaining</span>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => setCurrentView('budgets')} variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">Manage Budgets</Button>
        <Button onClick={() => setCurrentView('expenses')} variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">View Expenses</Button>
        <Button onClick={() => setCurrentView('verify-payments')} variant="outline" className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10">Verify Payments</Button>
      </div>
    </div>
  );
}
