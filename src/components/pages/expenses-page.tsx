'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt, Plus, CheckCircle, XCircle, Loader2,
  Package, Code, Wrench, Calendar, Clock, DollarSign,
  AlertCircle, TrendingDown,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Expense, ExpenseStatus } from '@/types';
import { ExpenseBadge } from '@/components/shared/status-badge';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const CATEGORY_ICON: Record<string, { icon: typeof Receipt; color: string }> = {
  MATERIALS: { icon: Package, color: 'text-cyan-400 bg-cyan-500/10' },
  SOFTWARE: { icon: Code, color: 'text-emerald-400 bg-emerald-500/10' },
  EQUIPMENT: { icon: Wrench, color: 'text-amber-400 bg-amber-500/10' },
  EVENTS: { icon: Calendar, color: 'text-violet-400 bg-violet-500/10' },
};

const STATUS_BORDER: Record<string, string> = {
  PENDING: 'border-l-amber-400',
  APPROVED: 'border-l-emerald-400',
  REJECTED: 'border-l-red-400',
};

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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function ExpensesPage() {
  const { currentUser } = useAppStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'MATERIALS', description: '', budgetId: '' });
  const [budgets, setBudgets] = useState<{ id: string; title: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const canCreate = currentUser && ['TREASURER', 'PLATFORM_ADMIN'].includes(currentUser.role);
  const canApprove = currentUser && ['GS', 'PRESIDENT', 'PLATFORM_ADMIN'].includes(currentUser.role);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const r = await fetch(`/api/expenses${params}`);
      const d = await r.json();
      if (d.success) setExpenses(d.data.expenses || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadExpenses(); }, [statusFilter]);

  useEffect(() => {
    fetch('/api/budgets')
      .then(r => r.json())
      .then(d => {
        if (d.success) setBudgets((d.data.budgets || []).map((b: { id: string; title: string }) => ({ id: b.id, title: b.title })));
      })
      .catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setCreating(true);
    try {
      const r = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), createdBy: currentUser.id }),
      });
      const d = await r.json();
      if (d.success) {
        setDialogOpen(false);
        loadExpenses();
        setForm({ title: '', amount: '', category: 'MATERIALS', description: '', budgetId: '' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    if (!currentUser) return;
    setApprovingId(id);
    try {
      // API expects: action (APPROVE/REJECT) and approvedBy (not approverId/status)
      const apiAction = action === 'APPROVED' ? 'APPROVE' : 'REJECT';
      const r = await fetch(`/api/expenses/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: apiAction, approvedBy: currentUser.id }),
      });
      const d = await r.json();
      if (d.success) {
        loadExpenses();
        toast({ title: action === 'APPROVED' ? 'Expense Approved' : 'Expense Rejected', description: action === 'APPROVED' ? 'The expense has been approved.' : 'The expense has been rejected.' });
      } else {
        toast({ title: 'Error', description: d.error || 'Failed to update expense.', variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Network error.', variant: 'destructive' });
    } finally {
      setApprovingId(null);
    }
  };

  // Computed stats
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingCount = expenses.filter(e => e.status === 'PENDING').length;
  const approvedTotal = expenses.filter(e => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0);
  const rejectedCount = expenses.filter(e => e.status === 'REJECTED').length;

  const statusCounts = useMemo(() => ({
    all: expenses.length,
    PENDING: pendingCount,
    APPROVED: expenses.filter(e => e.status === 'APPROVED').length,
    REJECTED: rejectedCount,
  }), [expenses, pendingCount, rejectedCount]);

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
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <Receipt className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Expenses</h1>
              <p className="text-sm text-gray-400">Track and manage club expenses</p>
            </div>
          </div>
          {canCreate && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-500">
                  <Plus className="mr-2 h-4 w-4" />Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-[#1a1a2e] text-white">
                <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-gray-400">Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className="border-white/10 bg-white/5" /></div>
                  <div className="space-y-1.5"><Label className="text-gray-400">Amount (৳)</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required className="border-white/10 bg-white/5" /></div>
                  <div className="space-y-1.5"><Label className="text-gray-400">Category</Label><Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}><SelectTrigger className="border-white/10 bg-white/5"><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-[#1a1a2e]"><SelectItem value="MATERIALS">Materials</SelectItem><SelectItem value="SOFTWARE">Software</SelectItem><SelectItem value="EQUIPMENT">Equipment</SelectItem><SelectItem value="EVENTS">Events</SelectItem></SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-gray-400">Budget</Label><Select value={form.budgetId} onValueChange={v => setForm(p => ({ ...p, budgetId: v }))}><SelectTrigger className="border-white/10 bg-white/5"><SelectValue placeholder="Select budget" /></SelectTrigger><SelectContent className="border-white/10 bg-[#1a1a2e]">{budgets.map(b => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-gray-400">Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="border-white/10 bg-white/5" /></div>
                  <Button type="submit" disabled={creating} className="w-full bg-emerald-600 text-white">{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Add Expense'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </motion.div>

      {/* Stats Bar */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Total Expenses" value={`৳${totalExpenses.toLocaleString()}`} delay={0} />
        <StatCard icon={Clock} label="Pending Count" value={pendingCount.toString()} trend={pendingCount > 0 ? 'down' : 'up'} delay={0.05} />
        <StatCard icon={CheckCircle} label="Approved Total" value={`৳${approvedTotal.toLocaleString()}`} trend="up" delay={0.1} />
        <StatCard icon={AlertCircle} label="Rejected Count" value={rejectedCount.toString()} delay={0.15} />
      </div>

      {/* Status Filter - Pill/Tab Style with Count Badges */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => {
          const count = statusCounts[s];
          const isActive = statusFilter === s;
          const colorMap: Record<string, string> = {
            all: isActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : '',
            PENDING: isActive ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : '',
            APPROVED: isActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : '',
            REJECTED: isActive ? 'bg-red-500/15 text-red-400 border-red-500/20' : '',
          };
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border ${
                colorMap[s] || 'bg-white/[0.02] text-gray-500 border-white/5 hover:bg-white/5 hover:text-gray-400'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className={`h-4 min-w-[18px] px-1 text-[10px] rounded-full ${
                    isActive ? 'bg-white/10 text-inherit' : 'bg-white/5 text-gray-600'
                  }`}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Expense Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-white/5" />)}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {expenses.map((expense) => {
            const catConfig = CATEGORY_ICON[expense.category] || CATEGORY_ICON.MATERIALS;
            const CatIcon = catConfig.icon;
            const borderColor = STATUS_BORDER[expense.status] || 'border-l-gray-500';

            return (
              <motion.div key={expense.id} variants={item} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                <Card className={`border-white/5 border-l-2 ${borderColor} bg-[#111]/60 backdrop-blur transition-all hover:border-white/10 hover:shadow-lg hover:shadow-emerald-500/5`}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${catConfig.color}`}>
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{expense.title}</p>
                        <ExpenseBadge status={expense.status} />
                      </div>
                      <p className="text-xs text-gray-500">{expense.category} • ৳{expense.amount.toLocaleString()}</p>
                      {expense.description && <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{expense.description}</p>}
                      <p className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {timeAgo(expense.createdAt)}
                      </p>
                    </div>
                    {canApprove && expense.status === 'PENDING' && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" onClick={() => handleApprove(expense.id, 'APPROVED')} disabled={approvingId === expense.id} className="bg-emerald-600 text-white h-8 text-xs">
                          {approvingId === expense.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-1 h-3 w-3" />}Approve
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(expense.id, 'REJECTED')} disabled={approvingId === expense.id} variant="destructive" className="h-8 text-xs">
                          {approvingId === expense.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <XCircle className="mr-1 h-3 w-3" />}Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {expenses.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/5 mb-4">
                <Receipt className="h-10 w-10 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-1">No expenses found</h3>
              <p className="text-sm text-gray-600 max-w-xs">
                {statusFilter !== 'all' ? 'Try a different filter or add a new expense.' : 'Add your first expense to get started.'}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
