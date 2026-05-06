'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Download, ArrowUpRight, ArrowDownRight, CircleDot } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Payment } from '@/types';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const PAYMENT_STATUS_CONFIG: Record<string, { color: string; dotColor: string; label: string }> = {
  VERIFIED: { color: 'text-emerald-400', dotColor: 'bg-emerald-400', label: 'Verified' },
  PENDING: { color: 'text-amber-400', dotColor: 'bg-amber-400', label: 'Pending' },
  REJECTED: { color: 'text-red-400', dotColor: 'bg-red-400', label: 'Rejected' },
};

export function FinancePage() {
  const { setCurrentView } = useAppStore();
  const [stats, setStats] = useState({ totalMembers: 0, totalFunds: 0, activeEvents: 0, pendingApprovals: 0 });
  const [budgets, setBudgets] = useState<{ id: string; title: string; amount: number; expenses: { amount: number; status: string }[] }[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { if (d.success && d.data) { const s = d.data.stats || d.data; setStats({ totalMembers: s.totalMembers ?? 0, totalFunds: s.totalFunds ?? 0, activeEvents: s.activeEvents ?? 0, pendingApprovals: s.pendingApprovals ?? 0 }); } }).catch(() => {});
    fetch('/api/budgets').then(r => r.json()).then(d => { if (d.success) setBudgets(d.data.budgets || []); }).catch(() => {});
    fetch('/api/payments').then(r => r.json()).then(d => { if (d.success) setRecentPayments((d.data.payments || []).slice(0, 5)); }).catch(() => {});
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

  // SVG donut chart parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (utilizationPercent / 100) * circumference;

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
          <Button variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Total Funds" value={`৳${stats.totalFunds.toLocaleString()}`} trend="up" delay={0} />
        <StatCard icon={TrendingUp} label="Active Budgets" value={budgets.length} trend="neutral" delay={0.1} />
        <StatCard icon={TrendingDown} label="Pending" value={stats.pendingApprovals} trend="neutral" delay={0.2} />
        <StatCard icon={BarChart3} label="Members" value={stats.totalMembers} trend="up" delay={0.3} />
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

      {/* Recent Transactions */}
      <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-white text-sm">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('verify-payments')} className="text-emerald-400 hover:text-emerald-300 text-xs">
            View All →
          </Button>
        </CardHeader>
        <CardContent>
          {recentPayments.length > 0 ? (
            <div className="space-y-2">
              {recentPayments.map((payment, i) => {
                const statusConfig = PAYMENT_STATUS_CONFIG[payment.status] || PAYMENT_STATUS_CONFIG.PENDING;
                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      payment.status === 'VERIFIED' ? 'bg-emerald-500/10' :
                      payment.status === 'PENDING' ? 'bg-amber-500/10' : 'bg-red-500/10'
                    }`}>
                      {payment.status === 'VERIFIED' ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className={`h-4 w-4 ${payment.status === 'PENDING' ? 'text-amber-400' : 'text-red-400'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{payment.user?.name || 'Unknown'}</p>
                        <span className={`flex items-center gap-1 text-[10px] ${statusConfig.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor}`} />
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{payment.type} • {payment.transactionId}</p>
                    </div>
                    <span className="text-sm font-semibold text-white shrink-0">৳{payment.amount.toLocaleString()}</span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <DollarSign className="h-8 w-8 mx-auto text-gray-600 mb-2" />
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
