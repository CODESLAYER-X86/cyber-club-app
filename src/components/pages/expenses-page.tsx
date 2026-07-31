'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt, Plus, CheckCircle, XCircle, Loader2,
  Clock, DollarSign, AlertCircle, Trash2,
  ChevronDown, ChevronUp, User, Paperclip, Calendar,
  Shield, ShieldCheck, FileText,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Expense, ExpenseItem, ExpenseStatus } from '@/types';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const UNIT_OPTIONS = ['pcs', 'kg', 'box', 'set', 'pair', 'pack', 'liter', 'meter', 'other'] as const;

const STATUS_BORDER: Record<string, string> = {
  PENDING: 'border-l-amber-400',
  APPROVED: 'border-l-emerald-400',
  REJECTED: 'border-l-red-400',
};

const STATUS_DOT: Record<ExpenseStatus, { emoji: string; color: string; bg: string }> = {
  PENDING: { emoji: '🟡', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/20' },
  APPROVED: { emoji: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/20' },
  REJECTED: { emoji: '🔴', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/20' },
};

const DUAL_STATUS_CONFIG: Record<ExpenseStatus, { label: string; color: string; dot: string }> = {
  PENDING: { label: 'Pending', color: 'text-amber-400', dot: 'bg-amber-400' },
  APPROVED: { label: 'Approved', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  REJECTED: { label: 'Rejected', color: 'text-red-400', dot: 'bg-red-400' },
};

const SVG_PATTERN = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─── Animation variants ──────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// ─── Form Item Type ──────────────────────────────────────────────────────────

interface FormItem {
  itemName: string;
  quantity: number;
  unit: string;
  price: number;
}

function createEmptyItem(): FormItem {
  return { itemName: '', quantity: 1, unit: 'pcs', price: 0 };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExpensesPage() {
  const { currentUser } = useAppStore();

  // Data state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState(getTodayString());
  const [formNote, setFormNote] = useState('');
  const [formPurchasedBy, setFormPurchasedBy] = useState('');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState('');
  const [formItems, setFormItems] = useState<FormItem[]>([createEmptyItem()]);

  // Approval state
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Expanded items state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // ─── Permissions ─────────────────────────────────────────────────────────

  const canCreate = currentUser && ['TREASURER', 'PLATFORM_ADMIN'].includes(currentUser.role);
  const canApprove = currentUser && ['PRESIDENT', 'GS', 'PLATFORM_ADMIN'].includes(currentUser.role);
  const canPresidentApprove = currentUser && ['PRESIDENT', 'PLATFORM_ADMIN'].includes(currentUser.role);
  const canGsApprove = currentUser && ['GS', 'PLATFORM_ADMIN'].includes(currentUser.role);

  // ─── Computed total ──────────────────────────────────────────────────────

  const formTotal = useMemo(() => {
    return formItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }, [formItems]);

  // ─── Data fetching ──────────────────────────────────────────────────────

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

  useEffect(() => {
    loadExpenses();
  }, [statusFilter]);

  // ─── Stats ──────────────────────────────────────────────────────────────

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingCount = expenses.filter(e => e.status === 'PENDING').length;
  const approvedTotal = expenses.filter(e => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0);
  const rejectedCount = expenses.filter(e => e.status === 'REJECTED').length;

  const statusCounts = useMemo(() => ({
    all: expenses.length,
    PENDING: expenses.filter(e => e.status === 'PENDING').length,
    APPROVED: expenses.filter(e => e.status === 'APPROVED').length,
    REJECTED: expenses.filter(e => e.status === 'REJECTED').length,
  }), [expenses]);

  // ─── Form handlers ──────────────────────────────────────────────────────

  const resetForm = () => {
    setFormDate(getTodayString());
    setFormNote('');
    setFormPurchasedBy('');
    setFormAttachmentUrl('');
    setFormItems([createEmptyItem()]);
  };

  const handleAddItem = () => {
    setFormItems(prev => [...prev, createEmptyItem()]);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length <= 1) return;
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: string | number) => {
    setFormItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validate at least one item has a name and positive price
    const validItems = formItems.filter(item => item.itemName.trim() !== '' && item.price > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      toast({ title: 'Validation Error', description: 'At least one item with a name, quantity, and price is required.', variant: 'destructive' });
      return;
    }

    if (!formNote.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter a note/description for the expense.', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const payload = {
        title: formNote.trim(),
        date: formDate,
        purchasedBy: formPurchasedBy.trim() || undefined,
        attachmentUrl: formAttachmentUrl.trim() || undefined,
        items: validItems.map(item => ({
          itemName: item.itemName.trim(),
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
        })),
      };

      const r = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.success) {
        setDialogOpen(false);
        resetForm();
        loadExpenses();
        toast({ title: 'Expense Created', description: 'The expense has been submitted for approval.' });
      } else {
        toast({ title: 'Error', description: d.error || 'Failed to create expense.', variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // ─── Approval handler ───────────────────────────────────────────────────

  const handleApprove = async (id: string, approverRole: 'PRESIDENT' | 'GS', status: 'APPROVED' | 'REJECTED') => {
    if (!currentUser) return;

    const actionLabel = status === 'APPROVED' ? 'approve' : 'reject';
    const roleLabel = approverRole === 'PRESIDENT' ? 'President' : 'General Secretary';
    const confirmed = window.confirm(`Are you sure you want to ${actionLabel} this expense as ${roleLabel}?`);
    if (!confirmed) return;

    setApprovingId(id);
    try {
      const r = await fetch(`/api/expenses/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverRole, status }),
      });
      const d = await r.json();
      if (d.success) {
        loadExpenses();
        toast({
          title: status === 'APPROVED' ? 'Expense Approved' : 'Expense Rejected',
          description: `The expense has been ${status === 'APPROVED' ? 'approved' : 'rejected'} by ${roleLabel}.`,
        });
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

  // ─── Toggle expanded items ──────────────────────────────────────────────

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Gradient Header Banner ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/15 to-emerald-600/10 border border-emerald-500/10 p-6"
      >
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: `url("${SVG_PATTERN}")` }} />
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
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
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-500">
                  <Plus className="mr-2 h-4 w-4" />Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-[#1a1a2e] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white text-lg">Add New Expense</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-5">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <Label className="text-gray-400 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Date
                    </Label>
                    <Input
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      required
                      className="border-white/10 bg-white/5 text-white"
                    />
                  </div>

                  {/* Note / Title */}
                  <div className="space-y-1.5">
                    <Label className="text-gray-400 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Note <span className="text-red-400">*</span>
                    </Label>
                    <Textarea
                      value={formNote}
                      onChange={e => setFormNote(e.target.value)}
                      placeholder="Expense title / description"
                      required
                      rows={2}
                      className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
                    />
                  </div>

                  {/* Purchased By */}
                  <div className="space-y-1.5">
                    <Label className="text-gray-400 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Who went to purchase
                    </Label>
                    <Input
                      value={formPurchasedBy}
                      onChange={e => setFormPurchasedBy(e.target.value)}
                      placeholder="Name of the person who purchased"
                      className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
                    />
                  </div>

                  {/* Attachment URL */}
                  <div className="space-y-1.5">
                    <Label className="text-gray-400 flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5" /> Attachment URL <span className="text-gray-600">(optional)</span>
                    </Label>
                    <Input
                      value={formAttachmentUrl}
                      onChange={e => setFormAttachmentUrl(e.target.value)}
                      placeholder="https://..."
                      className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
                    />
                  </div>

                  {/* Purchased Items Table */}
                  <div className="space-y-3">
                    <Label className="text-gray-400 flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5" /> Purchased Items <span className="text-red-400">*</span>
                    </Label>
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                              <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs">Item Name</th>
                              <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs w-20">Qty</th>
                              <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs w-28">Unit</th>
                              <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs w-24">Price (৳)</th>
                              <th className="text-left px-3 py-2 text-gray-500 font-medium text-xs w-24">Subtotal</th>
                              <th className="text-center px-3 py-2 text-gray-500 font-medium text-xs w-12"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formItems.map((formItem, idx) => {
                              const subtotal = formItem.quantity * formItem.price;
                              return (
                                <tr key={idx} className="border-b border-white/5 last:border-b-0">
                                  <td className="px-3 py-2">
                                    <Input
                                      value={formItem.itemName}
                                      onChange={e => handleItemChange(idx, 'itemName', e.target.value)}
                                      placeholder="Item name"
                                      required
                                      className="border-white/10 bg-white/5 text-white h-8 text-xs placeholder:text-gray-600"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input
                                      type="number"
                                      min={1}
                                      value={formItem.quantity}
                                      onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                                      required
                                      className="border-white/10 bg-white/5 text-white h-8 text-xs w-20"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <Select
                                      value={formItem.unit}
                                      onValueChange={v => handleItemChange(idx, 'unit', v)}
                                    >
                                      <SelectTrigger className="border-white/10 bg-white/5 text-white h-8 text-xs w-28">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="border-white/10 bg-[#1a1a2e]">
                                        {UNIT_OPTIONS.map(u => (
                                          <SelectItem key={u} value={u}>{u}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      step={0.01}
                                      value={formItem.price || ''}
                                      onChange={e => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                                      required
                                      className="border-white/10 bg-white/5 text-white h-8 text-xs w-24"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="text-emerald-400 font-medium text-xs">
                                      ৳{subtotal.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveItem(idx)}
                                      disabled={formItems.length <= 1}
                                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItem}
                      className="border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Item
                    </Button>
                  </div>

                  {/* Total Expense */}
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                    <span className="text-gray-400 font-medium text-sm">Total Expense</span>
                    <span className="text-emerald-400 font-bold text-xl">৳{formTotal.toLocaleString()}</span>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={creating}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-500 h-10"
                  >
                    {creating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : (
                      'Submit for Approval'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </motion.div>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Total Expenses" value={`৳${totalExpenses.toLocaleString()}`} delay={0} />
        <StatCard icon={Clock} label="Pending Count" value={pendingCount.toString()} trend={pendingCount > 0 ? 'down' : 'up'} delay={0.05} />
        <StatCard icon={CheckCircle} label="Approved Total" value={`৳${approvedTotal.toLocaleString()}`} trend="up" delay={0.1} />
        <StatCard icon={AlertCircle} label="Rejected Count" value={rejectedCount.toString()} delay={0.15} />
      </div>

      {/* ── Status Filter ─────────────────────────────────────────────────── */}
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

      {/* ── Expense Cards ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {expenses.map((expense) => {
            const borderColor = STATUS_BORDER[expense.status] || 'border-l-gray-500';
            const statusConfig = STATUS_DOT[expense.status];
            const isExpanded = expandedItems.has(expense.id);
            const hasItems = expense.items && expense.items.length > 0;

            return (
              <motion.div key={expense.id} variants={item} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                <Card className={`border-white/5 border-l-2 ${borderColor} bg-[#111]/60 backdrop-blur transition-all hover:border-white/10 hover:shadow-lg hover:shadow-emerald-500/5`}>
                  <CardContent className="p-4">
                    {/* Top row: main info */}
                    <div className="flex items-start gap-4">
                      {/* Status icon */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        expense.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400'
                          : expense.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                      }`}>
                        <Receipt className="h-5 w-5" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-white">{expense.title}</p>
                          <Badge variant="outline" className={`text-xs font-medium ${statusConfig.bg}`}>
                            {statusConfig.emoji} {expense.status.charAt(0) + expense.status.slice(1).toLowerCase()}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(expense.date)}
                          </span>
                          <span className="text-emerald-400/80 font-medium">
                            ৳{expense.amount.toLocaleString()}
                          </span>
                          {expense.purchasedBy && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {expense.purchasedBy}
                            </span>
                          )}
                          {expense.attachmentUrl && (
                            <a
                              href={expense.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              <Paperclip className="h-3 w-3" />
                              Attachment
                            </a>
                          )}
                        </div>

                        <p className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(expense.createdAt)}
                          {expense.creator && (
                            <span className="ml-1">by {expense.creator.name}</span>
                          )}
                        </p>
                      </div>

                      {/* Amount badge */}
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-bold text-white">৳{expense.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-600">total</p>
                      </div>
                    </div>

                    {/* Dual approval status */}
                    <div className="mt-3 flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Shield className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-gray-500">President:</span>
                        <span className={`flex items-center gap-1 ${DUAL_STATUS_CONFIG[expense.presidentStatus].color}`}>
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${DUAL_STATUS_CONFIG[expense.presidentStatus].dot}`} />
                          {DUAL_STATUS_CONFIG[expense.presidentStatus].label}
                        </span>
                        {expense.presidentApprover && (
                          <span className="text-gray-600">({expense.presidentApprover.name})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <ShieldCheck className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-gray-500">GS:</span>
                        <span className={`flex items-center gap-1 ${DUAL_STATUS_CONFIG[expense.gsStatus].color}`}>
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${DUAL_STATUS_CONFIG[expense.gsStatus].dot}`} />
                          {DUAL_STATUS_CONFIG[expense.gsStatus].label}
                        </span>
                        {expense.gsApprover && (
                          <span className="text-gray-600">({expense.gsApprover.name})</span>
                        )}
                      </div>
                    </div>

                    {/* Items toggle */}
                    {hasItems && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleExpanded(expense.id)}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-400 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          {expense.items!.length} item{expense.items!.length > 1 ? 's' : ''}
                        </button>

                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-2"
                          >
                            <div className="rounded-lg border border-white/5 overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="text-left px-3 py-1.5 text-gray-500 font-medium">Item</th>
                                    <th className="text-center px-3 py-1.5 text-gray-500 font-medium">Qty</th>
                                    <th className="text-center px-3 py-1.5 text-gray-500 font-medium">Unit</th>
                                    <th className="text-right px-3 py-1.5 text-gray-500 font-medium">Price</th>
                                    <th className="text-right px-3 py-1.5 text-gray-500 font-medium">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {expense.items!.map((expItem: ExpenseItem) => (
                                    <tr key={expItem.id} className="border-b border-white/5 last:border-b-0">
                                      <td className="px-3 py-1.5 text-gray-300">{expItem.itemName}</td>
                                      <td className="px-3 py-1.5 text-center text-gray-400">{expItem.quantity}</td>
                                      <td className="px-3 py-1.5 text-center text-gray-400">{expItem.unit}</td>
                                      <td className="px-3 py-1.5 text-right text-gray-400">৳{expItem.price.toLocaleString()}</td>
                                      <td className="px-3 py-1.5 text-right text-emerald-400/80 font-medium">
                                        ৳{(expItem.quantity * expItem.price).toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Approval Actions */}
                    {canApprove && expense.status === 'PENDING' && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-[10px] text-gray-600 mb-2 uppercase tracking-wider font-medium">Approval Actions</p>
                        <div className="flex flex-wrap gap-2">
                          {canPresidentApprove && expense.presidentStatus === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(expense.id, 'PRESIDENT', 'APPROVED')}
                                disabled={approvingId === expense.id}
                                className="bg-emerald-600 text-white hover:bg-emerald-500 h-7 text-xs"
                              >
                                {approvingId === expense.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                )}
                                President Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(expense.id, 'PRESIDENT', 'REJECTED')}
                                disabled={approvingId === expense.id}
                                variant="destructive"
                                className="h-7 text-xs"
                              >
                                {approvingId === expense.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <XCircle className="mr-1 h-3 w-3" />
                                )}
                                President Reject
                              </Button>
                            </>
                          )}
                          {canGsApprove && expense.gsStatus === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(expense.id, 'GS', 'APPROVED')}
                                disabled={approvingId === expense.id}
                                className="bg-cyan-600 text-white hover:bg-cyan-500 h-7 text-xs"
                              >
                                {approvingId === expense.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                )}
                                GS Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(expense.id, 'GS', 'REJECTED')}
                                disabled={approvingId === expense.id}
                                variant="destructive"
                                className="h-7 text-xs"
                              >
                                {approvingId === expense.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <XCircle className="mr-1 h-3 w-3" />
                                )}
                                GS Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Empty state */}
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
