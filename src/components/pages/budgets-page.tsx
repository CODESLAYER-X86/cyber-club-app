'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, Plus, Loader2, Settings, Calendar, Wrench,
  CircleDollarSign, TrendingDown, TrendingUp, Minus,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { StatCard } from '@/components/shared/stat-card';
import { ExpenseBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BudgetWithExpenses {
  id: string;
  title: string;
  amount: number;
  category: string;
  period: string;
  expenses: { id: string; title: string; amount: number; status: string }[];
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Wallet; label: string; badgeClass: string; borderClass: string; iconBg: string; iconColor: string }> = {
  OPERATIONS: {
    icon: Settings,
    label: 'Operations',
    badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    borderClass: 'border-l-cyan-400',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
  },
  EVENTS: {
    icon: Calendar,
    label: 'Events',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    borderClass: 'border-l-emerald-400',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
  },
  EQUIPMENT: {
    icon: Wrench,
    label: 'Equipment',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    borderClass: 'border-l-amber-400',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
  },
};

const SVG_PATTERN = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+`;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function BudgetsPage() {
  const { currentUser } = useAppStore();
  const [budgets, setBudgets] = useState<BudgetWithExpenses[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'OPERATIONS', period: '' });
  const [creating, setCreating] = useState(false);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/budgets');
      const d = await r.json();
      if (d.success) setBudgets(d.data.budgets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadBudgets(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setCreating(true);
    try {
      const r = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), createdBy: currentUser.id }),
      });
      const d = await r.json();
      if (d.success) {
        setDialogOpen(false);
        loadBudgets();
        setForm({ title: '', amount: '', category: 'OPERATIONS', period: '' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce(
    (s, b) => s + (b.expenses?.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0) || 0),
    0
  );
  const remaining = totalBudget - totalSpent;
  const utilizationPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const getCategoryConfig = (cat: string) => CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.OPERATIONS;

  const getRemainingColor = (budget: BudgetWithExpenses) => {
    const spent = budget.expenses?.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0) || 0;
    const rem = budget.amount - spent;
    const pct = budget.amount > 0 ? rem / budget.amount : 1;
    if (pct > 0.5) return 'text-emerald-400';
    if (pct > 0.25) return 'text-amber-400';
    return 'text-red-400';
  };

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
        {/* Blur orbs */}
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <Wallet className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Budgets</h1>
              <p className="text-sm text-gray-400">Manage budget allocation and spending</p>
            </div>
          </div>
          {currentUser?.role === 'TREASURER' && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-500">
                  <Plus className="mr-2 h-4 w-4" />Create Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-[#1a1a2e] text-white">
                <DialogHeader><DialogTitle>Create Budget</DialogTitle></DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Title</Label>
                    <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className="border-white/10 bg-white/5" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Amount (৳)</Label>
                    <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required className="border-white/10 bg-white/5" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                      <SelectTrigger className="border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#1a1a2e]">
                        <SelectItem value="OPERATIONS">Operations</SelectItem>
                        <SelectItem value="EVENTS">Events</SelectItem>
                        <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Period</Label>
                    <Input value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))} placeholder="2025-Q3" required className="border-white/10 bg-white/5" />
                  </div>
                  <Button type="submit" disabled={creating} className="w-full bg-emerald-600 text-white">
                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </motion.div>

      {/* Budget Overview Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              {/* Donut/Ring Progress Indicator */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <motion.circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke="url(#budgetGradient)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - Math.min(utilizationPercent, 100) / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                  />
                  <defs>
                    <linearGradient id="budgetGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-white">{utilizationPercent.toFixed(0)}%</span>
                  <span className="text-[10px] text-gray-500">utilized</span>
                </div>
              </div>
              {/* Stats */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CircleDollarSign className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-gray-500">Total Budget</span>
                  </div>
                  <p className="text-xl font-bold text-white">৳{totalBudget.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs text-gray-500">Total Spent</span>
                  </div>
                  <p className="text-xl font-bold text-cyan-400">৳{totalSpent.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-gray-500">Remaining</span>
                  </div>
                  <p className={`text-xl font-bold ${remaining >= 0 ? (remaining / totalBudget > 0.5 ? 'text-emerald-400' : remaining / totalBudget > 0.25 ? 'text-amber-400' : 'text-red-400') : 'text-red-400'}`}>
                    ৳{remaining.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-white/5" />)}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
          {budgets.map((budget) => {
            const spent = budget.expenses?.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0) || 0;
            const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const rem = budget.amount - spent;
            const catConfig = getCategoryConfig(budget.category);
            const CatIcon = catConfig.icon;

            return (
              <motion.div key={budget.id} variants={item} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                <Card className={`border-white/5 border-l-2 ${catConfig.borderClass} bg-[#111]/60 backdrop-blur overflow-hidden transition-all hover:border-white/10 hover:shadow-lg hover:shadow-emerald-500/5`}>
                  {/* Hover glow */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
                  </div>
                  <CardContent className="relative pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${catConfig.iconBg}`}>
                          <CatIcon className={`h-4 w-4 ${catConfig.iconColor}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{budget.title}</h3>
                          <span className="text-xs text-gray-500">{budget.period}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${catConfig.badgeClass}`}>
                        {catConfig.label}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Spent: ৳{spent.toLocaleString()}</span>
                      <span className="text-emerald-400">Budget: ৳{budget.amount.toLocaleString()}</span>
                    </div>
                    {/* Gradient progress bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percent, 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">{percent.toFixed(1)}% utilized</p>
                      <p className={`text-xs font-medium ${getRemainingColor(budget)}`}>
                        ৳{rem.toLocaleString()} remaining
                      </p>
                    </div>
                    {budget.expenses && budget.expenses.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
                        <p className="text-xs font-medium text-gray-400">Expenses:</p>
                        {budget.expenses.slice(0, 3).map(exp => (
                          <div key={exp.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{exp.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-white">৳{exp.amount}</span>
                              <ExpenseBadge status={exp.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
