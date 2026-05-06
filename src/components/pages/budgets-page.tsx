'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { StatCard } from '@/components/shared/stat-card';
import { ExpenseBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BudgetWithExpenses { id: string; title: string; amount: number; category: string; period: string; expenses: { id: string; title: string; amount: number; status: string }[]; }

export function BudgetsPage() {
  const { currentUser } = useAppStore();
  const [budgets, setBudgets] = useState<BudgetWithExpenses[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'OPERATIONS', period: '' });
  const [creating, setCreating] = useState(false);

  const loadBudgets = async () => {
    setLoading(true);
    try { const r = await fetch('/api/budgets'); const d = await r.json(); if (d.success) setBudgets(d.data.budgets || []); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { loadBudgets(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setCreating(true);
    try {
      const r = await fetch('/api/budgets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount), createdBy: currentUser.id }) });
      const d = await r.json();
      if (d.success) { setDialogOpen(false); loadBudgets(); setForm({ title: '', amount: '', category: 'OPERATIONS', period: '' }); }
    } catch (e) { console.error(e); } finally { setCreating(false); }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.expenses?.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Budgets</h1><p className="text-sm text-gray-500">Manage budget allocation and spending</p></div>
        {currentUser?.role === 'TREASURER' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="bg-emerald-600 text-white hover:bg-emerald-500"><Plus className="mr-2 h-4 w-4" />Create Budget</Button></DialogTrigger>
            <DialogContent className="border-white/10 bg-[#1a1a2e] text-white">
              <DialogHeader><DialogTitle>Create Budget</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5"><Label className="text-gray-400">Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className="border-white/10 bg-white/5" /></div>
                <div className="space-y-1.5"><Label className="text-gray-400">Amount (৳)</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required className="border-white/10 bg-white/5" /></div>
                <div className="space-y-1.5"><Label className="text-gray-400">Category</Label><Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}><SelectTrigger className="border-white/10 bg-white/5"><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-[#1a1a2e]"><SelectItem value="OPERATIONS">Operations</SelectItem><SelectItem value="EVENTS">Events</SelectItem><SelectItem value="EQUIPMENT">Equipment</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-gray-400">Period</Label><Input value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))} placeholder="2025-Q3" required className="border-white/10 bg-white/5" /></div>
                <Button type="submit" disabled={creating} className="w-full bg-emerald-600 text-white">{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={Wallet} label="Total Budget" value={`৳${totalBudget.toLocaleString()}`} delay={0} />
        <StatCard icon={Wallet} label="Total Spent" value={`৳${totalSpent.toLocaleString()}`} trend={totalSpent > totalBudget * 0.8 ? 'down' : 'up'} delay={0.1} />
      </div>

      {loading ? <div className="grid gap-4 sm:grid-cols-2">{[1,2].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-white/5" />)}</div> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map((budget, i) => {
            const spent = budget.expenses?.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0) || 0;
            const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            return (
              <motion.div key={budget.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{budget.title}</h3>
                      <span className="text-xs text-gray-500">{budget.period}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-400">Spent: ৳{spent.toLocaleString()}</span><span className="text-emerald-400">Budget: ৳{budget.amount.toLocaleString()}</span></div>
                    <Progress value={Math.min(percent, 100)} className="h-2 bg-white/5 [&>div]:bg-emerald-500" />
                    <p className="mt-2 text-xs text-gray-500">{percent.toFixed(1)}% utilized</p>
                    {budget.expenses && budget.expenses.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
                        <p className="text-xs font-medium text-gray-400">Expenses:</p>
                        {budget.expenses.slice(0, 3).map(exp => (
                          <div key={exp.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{exp.title}</span>
                            <div className="flex items-center gap-2"><span className="text-white">৳{exp.amount}</span><ExpenseBadge status={exp.status} /></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
