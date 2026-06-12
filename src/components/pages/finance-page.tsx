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
      return d.getMonth() === monthIdx && d.getFullYear() === year && p.status === 'VERIFIED';
    });
    const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    data.push({ month: months[monthIdx], revenue });
  }

  return data;
}

export function FinancePage() {
  const { setCurrentView } = useAppStore();
  const [stats, setStats] = useState({ totalMembers: 0, totalFunds: 0, activeEvents: 0, pendingApprovals: 0, totalCertificates: 0 });
  const [budgets, setBudgets] = useState<{ id: string; title: string; amount: number; expenses: { amount: number; status: string }[] }[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { if (d.success && d.data) { const s = d.data.stats || d.data; setStats({ totalMembers: s.totalMembers ?? 0, totalFunds: s.totalFunds ?? 0, activeEvents: s.activeEvents ?? 0, pendingApprovals: s.pendingApprovals ?? 0, totalCertificates: s.totalCertificates ?? 0 }); } }).catch(() => {});
    fetch('/api/budgets').then(r => r.json()).then(d => { if (d.success) setBudgets(d.data.budgets || []); }).catch(() => {});
    fetch('/api/payments').then(r => r.json()).then(d => {
      if (d.success) {
        const payments = d.data.payments || [];
        setRecentPayments(payments.slice(0, 8));
        setAllPayments(payments);
      }
    }).catch(() => {});
  }, []);

  const chartData = budgets.map(b => ({
    name: b.title.length > 20 ? b.title.substring(0, 20) + '...' : b.title,
    Budget: b.amount,
    Spent: b.expenses?.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0) || 0,
  }));

  // Fund utilization calculation
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.expenses?.filter(e => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0) || 0), 0);
  const utilizationPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Monthly revenue trend data
  const monthlyRevenue = useMemo(() => generateMonthlyRevenue(allPayments), [allPayments]);

  // Pending payments count and amount
  const pendingPayments = allPayments.filter(p => p.status === 'PENDING');
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  // SVG donut chart parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (utilizationPercent / 100) * circumference;

  // Stat card progress values
  const fundsProgress = totalBudget > 0 ? Math.min(Math.round((stats.totalFunds / (totalBudget || 1)) * 100), 100) : 0;
  const budgetProgress = budgets.length > 0 ? Math.round((budgets.filter(b => { const spent = b.expenses?.filter(e => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0) || 0; return spent > 0; }).length / budgets.length) * 100) : 0;
  const pendingProgress = allPayments.length > 0 ? Math.round((pendingPayments.length / allPayments.length) * 100) : 0;

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
        {/* Blur Orbs */}
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Finance Overview</h1>
              <p className="text-sm text-gray-400">Financial health at a glance</p>
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
                    budgets.map(b => ({
                      Title: b.title,
                      Amount: b.amount,
                      Spent: b.expenses?.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0) || 0,
                      Remaining: b.amount - (b.expenses?.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0) || 0),
                    })),
                    'finance-export',
                    [
                      { key: 'Title', label: 'Budget Title' },
                      { key: 'Amount', label: 'Amount' },
                      { key: 'Spent', label: 'Spent' },
                      { key: 'Remaining', label: 'Remaining' },
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
        <StatCard icon={Wallet} label="Total Funds" value={`৳${stats.totalFunds.toLocaleString()}`} trend="up" delay={0} progress={fundsProgress} progressColor="#10b981" />
        <StatCard icon={BarChart3} label="Active Budgets" value={budgets.length} trend="neutral" delay={0.1} progress={budgetProgress} progressColor="#06b6d4" />
        <StatCard icon={Clock} label="Pending" value={`${pendingPayments.length} (৳${pendingAmount.toLocaleString()})`} trend="neutral" delay={0.2} progress={pendingProgress} progressColor="#f59e0b" />
        <StatCard icon={Receipt} label="Total Transactions" value={allPayments.length} trend="up" delay={0.3} progress={allPayments.length > 0 ? 100 : 0} progressColor="#8b5cf6" />
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
            ) : <p className="py-12 text-center text-gray-500">No budget data available</p>}
          </CardContent>
        </Card>

        {/* Fund Utilization Ring - 1 col */}
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader><CardTitle className="text-white text-sm">Fund Utilization</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <div className="relative">
              <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
                {/* Background circle */}
                <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                {/* Progress arc */}
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
                <span className="text-2xl font-bold text-white">{utilizationPercent}%</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Spent</span>
              </div>
            </div>
            <div className="mt-4 w-full space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Total Budget</span>
                <span className="text-emerald-400 font-medium">৳{totalBudget.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Total Spent</span>
                <span className="text-cyan-400 font-medium">৳{totalSpent.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Remaining</span>
                <span className="text-white font-medium">৳{(totalBudget - totalSpent).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Trend - Area Chart */}
      <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
            </div>
            <CardTitle className="text-white text-sm">Monthly Revenue Trend</CardTitle>
          </div>
          <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 text-[10px]">Last 6 Months</Badge>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                  activeDot={{ fill: '#10b981', strokeWidth: 2, stroke: '#0a0a0a', r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-gray-500 text-sm">No revenue data available</p>
          )}
        </CardContent>
      </Card>

      {/* Budget Utilization Progress Bars */}
      {budgets.length > 0 && (
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-sm">Budget Utilization</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('budgets')} className="text-emerald-400 hover:text-emerald-300 text-xs">
              Manage →
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgets.map((budget, i) => {
                const spent = budget.expenses?.filter(e => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0) || 0;
                const percent = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
                const barColor = percent > 90 ? '#ef4444' : percent > 70 ? '#f59e0b' : '#10b981';
                return (
                  <motion.div
                    key={budget.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-white font-medium truncate max-w-[60%]">{budget.title}</span>
                      <span className="text-xs text-gray-500 shrink-0">৳{spent.toLocaleString()} / ৳{budget.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, delay: i * 0.1 + 0.3, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: barColor }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-600">{percent}% utilized</span>
                      <span className="text-[10px] text-gray-600">৳{(budget.amount - spent).toLocaleString()} remaining</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions with Colored Type Indicators */}
      <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <CreditCard className="h-4 w-4 text-emerald-400" />
            </div>
            <CardTitle className="text-white text-sm">Recent Transactions</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('verify-payments')} className="text-emerald-400 hover:text-emerald-300 text-xs">
            View All →
          </Button>
        </CardHeader>
        <CardContent>
          {recentPayments.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {recentPayments.map((payment, i) => {
                const statusConfig = PAYMENT_STATUS_CONFIG[payment.status] || PAYMENT_STATUS_CONFIG.PENDING;
                const typeConfig = PAYMENT_TYPE_CONFIG[payment.type] || PAYMENT_TYPE_CONFIG.OTHER;
                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
                  >
                    {/* Type indicator with colored icon */}
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${typeConfig.bg}`}>
                      {payment.status === 'VERIFIED' ? (
                        <ArrowUpRight className={`h-4 w-4 ${typeConfig.icon}`} />
                      ) : payment.status === 'PENDING' ? (
                        <CircleDot className={`h-4 w-4 ${typeConfig.icon}`} />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{payment.user?.name || 'Unknown'}</p>
                        {/* Type badge */}
                        <Badge variant="outline" className={`${typeConfig.bg} ${typeConfig.color} border-transparent text-[9px] px-1.5 py-0 h-4 shrink-0`}>
                          {typeConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500 truncate">{payment.transactionId}</p>
                        <span className={`flex items-center gap-1 text-[10px] ${statusConfig.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor}`} />
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${payment.status === 'VERIFIED' ? 'text-emerald-400' : payment.status === 'PENDING' ? 'text-amber-400' : 'text-red-400'}`}>
                        ৳{payment.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-600">{new Date(payment.createdAt).toLocaleDateString()}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <CreditCard className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <p className="text-sm">No recent transactions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={() => setCurrentView('budgets')} variant="outline" className="border-emerald-500/20 text-emerald-400">Manage Budgets</Button>
        <Button onClick={() => setCurrentView('expenses')} variant="outline" className="border-cyan-500/20 text-cyan-400">View Expenses</Button>
        <Button onClick={() => setCurrentView('verify-payments')} variant="outline" className="border-amber-500/20 text-amber-400">Verify Payments</Button>
      </div>
    </div>
  );
}
