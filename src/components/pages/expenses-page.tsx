'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt, Plus, CheckCircle, XCircle, Loader2,
  Trash2, ChevronDown, ChevronUp, Shield, ShieldCheck,
  ArrowDownRight, DollarSign,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Expense, ExpenseItem } from '@/types';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

/* ─── Constants ─── */
const UNIT_OPTIONS = ['pcs', 'kg', 'box', 'set', 'pair', 'pack', 'liter', 'meter', 'other'] as const;

const STATUS_CONFIG: Record<string, { color: string; bg: string; dotColor: string; label: string; emoji: string }> = {
  PENDING: { color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/20', dotColor: 'bg-amber-400', label: 'Pending', emoji: '🟡' },
  APPROVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/20', dotColor: 'bg-emerald-400', label: 'Approved', emoji: '🟢' },
  REJECTED: { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/20', dotColor: 'bg-red-400', label: 'Rejected', emoji: '🔴' },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

interface FormItem {
  itemName: string;
  quantity: string;
  unit: string;
  price: string;
}

export function ExpensesPage() {
  const { currentUser } = useAppStore();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    note: '',
    purchasedBy: '',
    attachmentUrl: '',
  });
  const [formItems, setFormItems] = useState<FormItem[]>([
    { itemName: '', quantity: '1', unit: 'pcs', price: '' },
  ]);

  const canCreate = currentUser?.role === 'TREASURER' || currentUser?.role === 'PLATFORM_ADMIN';
  const canApprove = currentUser?.role === 'PRESIDENT' || currentUser?.role === 'GS' || currentUser?.role === 'PLATFORM_ADMIN';
  const canPresidentApprove = currentUser?.role === 'PRESIDENT' || currentUser?.role === 'PLATFORM_ADMIN';
  const canGsApprove = currentUser?.role === 'GS' || currentUser?.role === 'PLATFORM_ADMIN';

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/expenses');
      const d = await r.json();
      if (d.success) setExpenses(d.data.expenses || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExpenses(); }, []);

  // Calculate total from form items
  const calcTotal = () => formItems.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.price) || 0), 0);

  const addItem = () => setFormItems((p) => [...p, { itemName: '', quantity: '1', unit: 'pcs', price: '' }]);
  const removeItem = (idx: number) => setFormItems((p) => p.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof FormItem, value: string) =>
    setFormItems((p) => p.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (formItems.length === 0 || formItems.every((i) => !i.itemName)) {
      toast({ title: 'Error', description: 'Add at least one item', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: formItems.filter((i) => i.itemName).map((i) => ({
            itemName: i.itemName,
            quantity: parseInt(i.quantity) || 1,
            unit: i.unit,
            price: parseFloat(i.price) || 0,
          })),
          createdBy: currentUser.id,
        }),
      });
      const d = await r.json();
      if (d.success) {
        toast({ title: 'Expense submitted', description: 'Awaiting approval from President and GS.', variant: 'default' });
        setDialogOpen(false);
        setForm({ date: new Date().toISOString().split('T')[0], note: '', purchasedBy: '', attachmentUrl: '' });
        setFormItems([{ itemName: '', quantity: '1', unit: 'pcs', price: '' }]);
        loadExpenses();
      } else {
        toast({ title: 'Error', description: d.error || 'Failed to submit expense', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproval = async (expenseId: string, action: string) => {
    if (!currentUser) return;
    try {
      const r = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, approvedBy: currentUser.id, role: currentUser.role }),
      });
      const d = await r.json();
      if (d.success) {
        toast({ title: 'Success', description: `Expense ${action.includes('REJECT') ? 'rejected' : 'approved'}`, variant: 'default' });
        loadExpenses();
      } else {
        toast({ title: 'Error', description: d.error || 'Action failed', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  };

  // Filtered
  const filtered = filter === 'ALL' ? expenses : expenses.filter((e) => e.status === filter);
  const totalApproved = expenses.filter((e) => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0);
  const pendingCount = expenses.filter((e) => e.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-600/20 via-orange-600/15 to-amber-600/10 border border-amber-500/10 p-6"
      >
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/20">
              <ArrowDownRight className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Expenses</h1>
              <p className="text-sm text-gray-400">Record and approve expense entries</p>
            </div>
          </div>
          {canCreate && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 text-white hover:bg-amber-500">
                  <Plus className="mr-2 h-4 w-4" />Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-[#1a1a2e] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add New Expense</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Date</Label>
                      <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required className="border-white/10 bg-white/5" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-gray-400">Purchased By</Label>
                      <Input value={form.purchasedBy} onChange={(e) => setForm((p) => ({ ...p, purchasedBy: e.target.value }))} placeholder="Name of purchaser" className="border-white/10 bg-white/5" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Note</Label>
                    <Textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Brief description of the expense..." className="border-white/10 bg-white/5 min-h-[60px]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Attachment URL</Label>
                    <Input value={form.attachmentUrl} onChange={(e) => setForm((p) => ({ ...p, attachmentUrl: e.target.value }))} placeholder="https://..." className="border-white/10 bg-white/5" />
                  </div>

                  {/* Items Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-400">Items</Label>
                      <Button type="button" size="sm" variant="outline" className="border-white/10 text-gray-400 hover:text-white" onClick={addItem}>
                        <Plus className="h-3 w-3 mr-1" />Add Item
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="pb-2 text-left font-medium text-gray-400 w-[35%]">Name</th>
                            <th className="pb-2 text-center font-medium text-gray-400 w-[12%]">Qty</th>
                            <th className="pb-2 text-center font-medium text-gray-400 w-[15%]">Unit</th>
                            <th className="pb-2 text-right font-medium text-gray-400 w-[20%]">Price (৳)</th>
                            <th className="pb-2 text-right font-medium text-gray-400 w-[15%]">Subtotal</th>
                            <th className="pb-2 w-[3%]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {formItems.map((fi, idx) => (
                            <tr key={idx} className="border-b border-white/[0.03]">
                              <td className="py-2 pr-1">
                                <Input value={fi.itemName} onChange={(e) => updateItem(idx, 'itemName', e.target.value)} placeholder="Item name" required className="border-white/10 bg-white/5 h-8 text-sm" />
                              </td>
                              <td className="py-2 px-1">
                                <Input type="number" min="1" value={fi.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} className="border-white/10 bg-white/5 h-8 text-sm text-center" />
                              </td>
                              <td className="py-2 px-1">
                                <select value={fi.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} className="w-full h-8 rounded-md border border-white/10 bg-white/5 text-sm text-gray-300 px-2">
                                  {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                              </td>
                              <td className="py-2 px-1">
                                <Input type="number" step="0.01" min="0" value={fi.price} onChange={(e) => updateItem(idx, 'price', e.target.value)} placeholder="0" required className="border-white/10 bg-white/5 h-8 text-sm text-right" />
                              </td>
                              <td className="py-2 text-right text-sm text-gray-300">
                                ৳{((parseFloat(fi.quantity) || 0) * (parseFloat(fi.price) || 0)).toLocaleString()}
                              </td>
                              <td className="py-2 pl-1">
                                {formItems.length > 1 && (
                                  <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/10" onClick={() => removeItem(idx)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-end pt-2 border-t border-white/10">
                      <span className="text-sm text-gray-400 mr-2">Total:</span>
                      <span className="text-lg font-bold text-white">৳{calcTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full bg-amber-600 text-white hover:bg-amber-500">
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit for Approval'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Approved" value={`৳${totalApproved.toLocaleString()}`} icon={ArrowDownRight} trend="down" trendLabel="Sum of approved expenses" className="border-amber-500/10" />
        <StatCard label="Pending" value={pendingCount.toString()} icon={Loader2} trend="neutral" trendLabel="Awaiting approval" className="border-amber-500/10" />
        <StatCard label="Total Entries" value={expenses.length.toString()} icon={Receipt} trend="neutral" trendLabel="All expense records" className="border-cyan-500/10" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => {
          const count = f === 'ALL' ? expenses.length : expenses.filter((e) => e.status === f).length;
          return (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              className={filter === f ? 'bg-amber-600 text-white' : 'border-white/10 text-gray-400 hover:text-white'}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All' : STATUS_CONFIG[f]?.label || f} ({count})
            </Button>
          );
        })}
      </div>

      {/* Expense History */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">No expenses found</p>
        ) : (
          filtered.map((expense) => {
            const sc = STATUS_CONFIG[expense.status] || STATUS_CONFIG.PENDING;
            const isPending = expense.status === 'PENDING';
            const isExpanded = expandedId === expense.id;
            const mayPresApprove = isPending && expense.presidentStatus === 'PENDING' && canPresidentApprove;
            const mayGsApprove = isPending && expense.gsStatus === 'PENDING' && expense.presidentStatus === 'APPROVED' && canGsApprove;
            const mayPresReject = isPending && expense.presidentStatus === 'PENDING' && canPresidentApprove;
            const mayGsReject = isPending && expense.gsStatus === 'PENDING' && canGsApprove;

            return (
              <motion.div key={expense.id} variants={item}>
                <Card className={`border-white/5 border-l-2 ${expense.status === 'APPROVED' ? 'border-l-emerald-400' : expense.status === 'REJECTED' ? 'border-l-red-400' : 'border-l-amber-400'} bg-[#111]/60 backdrop-blur`}>
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                          <Receipt className="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{expense.note || 'Expense'}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {expense.purchasedBy && ` · By: ${expense.purchasedBy}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-amber-400">৳{expense.amount.toLocaleString()}</span>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${sc.dotColor}`} />
                          <span className={`text-xs ${sc.color}`}>{sc.label}</span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 space-y-3 border-t border-white/5 pt-3">
                        {/* Items Table */}
                        {expense.items && expense.items.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-white/5">
                                  <th className="pb-2 text-left font-medium text-gray-400">Name</th>
                                  <th className="pb-2 text-center font-medium text-gray-400">Qty</th>
                                  <th className="pb-2 text-center font-medium text-gray-400">Unit</th>
                                  <th className="pb-2 text-right font-medium text-gray-400">Price</th>
                                  <th className="pb-2 text-right font-medium text-gray-400">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expense.items.map((it: any) => (
                                  <tr key={it.id} className="border-b border-white/[0.03]">
                                    <td className="py-1.5 text-gray-300">{it.itemName}</td>
                                    <td className="py-1.5 text-center text-gray-300">{it.quantity}</td>
                                    <td className="py-1.5 text-center text-gray-400">{it.unit}</td>
                                    <td className="py-1.5 text-right text-gray-300">৳{it.price.toLocaleString()}</td>
                                    <td className="py-1.5 text-right text-white font-medium">৳{(it.quantity * it.price).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t border-white/10">
                                  <td colSpan={4} className="pt-2 text-right font-medium text-gray-400">Total</td>
                                  <td className="pt-2 text-right font-bold text-amber-400">৳{expense.amount.toLocaleString()}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}

                        {/* Approval Status */}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Submitted by: <span className="text-gray-300">{expense.creator?.name || '—'}</span></span>
                          <span className={expense.presidentStatus === 'APPROVED' ? 'text-emerald-400' : expense.presidentStatus === 'REJECTED' ? 'text-red-400' : ''}>
                            President: {expense.presidentStatus} {expense.presidentApprover ? `(${expense.presidentApprover.name})` : ''}
                          </span>
                          <span className={expense.gsStatus === 'APPROVED' ? 'text-emerald-400' : expense.gsStatus === 'REJECTED' ? 'text-red-400' : ''}>
                            GS: {expense.gsStatus} {expense.gsApprover ? `(${expense.gsApprover.name})` : ''}
                          </span>
                        </div>

                        {/* Approval Actions */}
                        {canApprove && isPending && (mayPresApprove || mayGsApprove || mayPresReject || mayGsReject) && (
                          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            {mayPresApprove && (
                              <Button size="sm" className="h-8 bg-emerald-600 text-white hover:bg-emerald-500" onClick={() => handleApproval(expense.id, 'PRESIDENT_APPROVE')}>
                                <Shield className="h-3 w-3 mr-1" />President Approve
                              </Button>
                            )}
                            {mayGsApprove && (
                              <Button size="sm" className="h-8 bg-emerald-600 text-white hover:bg-emerald-500" onClick={() => handleApproval(expense.id, 'GS_APPROVE')}>
                                <ShieldCheck className="h-3 w-3 mr-1" />GS Approve
                              </Button>
                            )}
                            {mayPresReject && (
                              <Button size="sm" variant="outline" className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => handleApproval(expense.id, 'PRESIDENT_REJECT')}>
                                <XCircle className="h-3 w-3 mr-1" />Reject
                              </Button>
                            )}
                            {mayGsReject && (
                              <Button size="sm" variant="outline" className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => handleApproval(expense.id, 'GS_REJECT')}>
                                <XCircle className="h-3 w-3 mr-1" />Reject
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
