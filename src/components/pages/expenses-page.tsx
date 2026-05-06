'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Expense, ExpenseStatus } from '@/types';
import { ExpenseBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function ExpensesPage() {
  const { currentUser } = useAppStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'MATERIALS', description: '', budgetId: '' });
  const [budgets, setBudgets] = useState<{ id: string; title: string }[]>([]);
  const [creating, setCreating] = useState(false);

  const canCreate = currentUser && ['TREASURER', 'PLATFORM_ADMIN'].includes(currentUser.role);
  const canApprove = currentUser && ['GS', 'PRESIDENT', 'PLATFORM_ADMIN'].includes(currentUser.role);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const r = await fetch(`/api/expenses${params}`); const d = await r.json(); if (d.success) setExpenses(d.data.expenses || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { loadExpenses(); }, [statusFilter]);

  useEffect(() => { fetch('/api/budgets').then(r => r.json()).then(d => { if (d.success) setBudgets((d.data.budgets || []).map((b: { id: string; title: string }) => ({ id: b.id, title: b.title }))); }).catch(() => {}); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!currentUser) return; setCreating(true);
    try {
      const r = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount), createdBy: currentUser.id }) });
      const d = await r.json(); if (d.success) { setDialogOpen(false); loadExpenses(); setForm({ title: '', amount: '', category: 'MATERIALS', description: '', budgetId: '' }); }
    } catch (e) { console.error(e); } finally { setCreating(false); }
  };

  const handleApprove = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    if (!currentUser) return;
    try {
      const r = await fetch(`/api/expenses/${id}/approve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: action, approverId: currentUser.id }) });
      const d = await r.json(); if (d.success) loadExpenses();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Expenses</h1><p className="text-sm text-gray-500">Track and manage club expenses</p></div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="bg-emerald-600 text-white hover:bg-emerald-500"><Plus className="mr-2 h-4 w-4" />Add Expense</Button></DialogTrigger>
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

      <div className="flex gap-2">
        {['all', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className={statusFilter === s ? 'bg-emerald-600 text-white' : 'border-white/10 text-gray-400'}>
            {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-white/5" />)}</div> : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <motion.div key={expense.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10"><Receipt className="h-5 w-5 text-cyan-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{expense.title}</p>
                    <p className="text-xs text-gray-500">{expense.category} • ৳{expense.amount.toLocaleString()}</p>
                    {expense.description && <p className="text-xs text-gray-600 mt-0.5">{expense.description}</p>}
                  </div>
                  <ExpenseBadge status={expense.status} />
                  {canApprove && expense.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(expense.id, 'APPROVED')} className="bg-emerald-600 text-white h-8 text-xs"><CheckCircle className="mr-1 h-3 w-3" />Approve</Button>
                      <Button size="sm" onClick={() => handleApprove(expense.id, 'REJECTED')} variant="destructive" className="h-8 text-xs"><XCircle className="mr-1 h-3 w-3" />Reject</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {expenses.length === 0 && <p className="py-12 text-center text-gray-500">No expenses found</p>}
        </div>
      )}
    </div>
  );
}
