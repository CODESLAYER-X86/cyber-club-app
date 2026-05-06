'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function FinancePage() {
  const { setCurrentView } = useAppStore();
  const [stats, setStats] = useState({ totalMembers: 0, totalFunds: 0, activeEvents: 0, pendingApprovals: 0 });
  const [budgets, setBudgets] = useState<{ id: string; title: string; amount: number; expenses: { amount: number; status: string }[] }[]>([]);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { if (d.success && d.data) { const s = d.data.stats || d.data; setStats({ totalMembers: s.totalMembers ?? 0, totalFunds: s.totalFunds ?? 0, activeEvents: s.activeEvents ?? 0, pendingApprovals: s.pendingApprovals ?? 0 }); } }).catch(() => {});
    fetch('/api/budgets').then(r => r.json()).then(d => { if (d.success) setBudgets(d.data || []); }).catch(() => {});
  }, []);

  const chartData = budgets.map(b => ({
    name: b.title.length > 20 ? b.title.substring(0, 20) + '...' : b.title,
    Budget: b.amount,
    Spent: b.expenses?.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0) || 0,
  }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Finance Overview</h1><p className="text-sm text-gray-500">Financial health at a glance</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Total Funds" value={`৳${stats.totalFunds.toLocaleString()}`} trend="up" delay={0} />
        <StatCard icon={TrendingUp} label="Active Budgets" value={budgets.length} trend="neutral" delay={0.1} />
        <StatCard icon={TrendingDown} label="Pending" value={stats.pendingApprovals} trend="neutral" delay={0.2} />
        <StatCard icon={BarChart3} label="Members" value={stats.totalMembers} trend="up" delay={0.3} />
      </div>

      <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
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

      <div className="flex gap-3">
        <Button onClick={() => setCurrentView('budgets')} variant="outline" className="border-emerald-500/20 text-emerald-400">Manage Budgets</Button>
        <Button onClick={() => setCurrentView('expenses')} variant="outline" className="border-cyan-500/20 text-cyan-400">View Expenses</Button>
        <Button onClick={() => setCurrentView('verify-payments')} variant="outline" className="border-amber-500/20 text-amber-400">Verify Payments</Button>
      </div>
    </div>
  );
}
