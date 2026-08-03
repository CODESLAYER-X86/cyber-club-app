'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, Plus, Loader2, CheckCircle, XCircle,
  Eye, Landmark, Upload, Shield, ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { TreasuryDeposit, TreasuryDepositSource } from '@/types';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

/* ─── Constants ─── */
const DEPOSIT_SOURCE_LABELS: Record<string, string> = {
  UNIVERSITY_FUND: 'University Fund',
  SPONSOR: 'Sponsor',
  EVENT_REGISTRATION: 'Event Registration',
  MEMBERSHIP_REGISTRATION: 'Membership Registration',
  DONATION: 'Donation',
  OTHER: 'Other',
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; dotColor: string; label: string; emoji: string }> = {
  PENDING: { color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/20', dotColor: 'bg-amber-400', label: 'Pending', emoji: '🟡' },
  APPROVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/20', dotColor: 'bg-emerald-400', label: 'Approved', emoji: '🟢' },
  REJECTED: { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/20', dotColor: 'bg-red-400', label: 'Rejected', emoji: '🔴' },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export function DepositsPage() {
  const { currentUser } = useAppStore();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');

  // Form state
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    source: 'UNIVERSITY_FUND' as string,
    note: '',
    attachmentUrl: '',
  });

  const canSubmit = currentUser?.role === 'TREASURER' || currentUser?.role === 'PLATFORM_ADMIN';
  const canApprove = currentUser?.role === 'PRESIDENT' || currentUser?.role === 'GS' || currentUser?.role === 'PLATFORM_ADMIN';
  const canPresidentApprove = currentUser?.role === 'PRESIDENT' || currentUser?.role === 'PLATFORM_ADMIN';
  const canGsApprove = currentUser?.role === 'GS' || currentUser?.role === 'PLATFORM_ADMIN';

  const loadDeposits = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/treasury/deposits');
      const d = await r.json();
      if (d.success) setDeposits(d.data.deposits || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDeposits(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    try {
      const r = await fetch('/api/treasury/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          submittedBy: currentUser.id,
        }),
      });
      const d = await r.json();
      if (d.success) {
        toast({ title: 'Deposit submitted', description: 'Awaiting approval from President and GS.', variant: 'default' });
        setDialogOpen(false);
        setForm({ date: new Date().toISOString().split('T')[0], amount: '', source: 'UNIVERSITY_FUND', note: '', attachmentUrl: '' });
        loadDeposits();
      } else {
        toast({ title: 'Error', description: d.error || 'Failed to submit deposit', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproval = async (depositId: string, action: string) => {
    if (!currentUser) return;
    try {
      const r = await fetch(`/api/treasury/deposits/${depositId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, approvedBy: currentUser.id, role: currentUser.role }),
      });
      const d = await r.json();
      if (d.success) {
        toast({ title: 'Success', description: `Deposit ${action.includes('REJECT') ? 'rejected' : 'approved'}`, variant: 'default' });
        loadDeposits();
      } else {
        toast({ title: 'Error', description: d.error || 'Action failed', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  };

  // Filtered deposits
  const filtered = filter === 'ALL' ? deposits : deposits.filter((d) => d.status === filter);
  const totalAmount = deposits.filter((d) => d.status === 'APPROVED').reduce((s, d) => s + d.amount, 0);
  const pendingCount = deposits.filter((d) => d.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/15 to-emerald-600/10 border border-emerald-500/10 p-6"
      >
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <ArrowUpRight className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Deposits</h1>
              <p className="text-sm text-gray-400">Record and approve treasury deposits</p>
            </div>
          </div>
          {canSubmit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-500">
                  <Plus className="mr-2 h-4 w-4" />Record Deposit
                </Button>
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-[#1a1a2e] text-white max-w-md">
                <DialogHeader><DialogTitle>Record New Deposit</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Date</Label>
                    <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required className="border-white/10 bg-white/5" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Amount (৳)</Label>
                    <Input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required placeholder="0.00" className="border-white/10 bg-white/5" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Source</Label>
                    <Select value={form.source} onValueChange={(v) => setForm((p) => ({ ...p, source: v }))}>
                      <SelectTrigger className="border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#1a1a2e]">
                        {Object.entries(DEPOSIT_SOURCE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Note</Label>
                    <Textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Optional description..." className="border-white/10 bg-white/5 min-h-[60px]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-400">Attachment URL</Label>
                    <Input value={form.attachmentUrl} onChange={(e) => setForm((p) => ({ ...p, attachmentUrl: e.target.value }))} placeholder="https://..." className="border-white/10 bg-white/5" />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 text-white hover:bg-emerald-500">
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
        <StatCard label="Total Approved" value={`৳${totalAmount.toLocaleString()}`} icon={ArrowUpRight} trend="up" trendLabel="Sum of approved deposits" className="border-emerald-500/10" />
        <StatCard label="Pending" value={pendingCount.toString()} icon={Loader2} trend="neutral" trendLabel="Awaiting approval" className="border-amber-500/10" />
        <StatCard label="Total Entries" value={deposits.length.toString()} icon={Landmark} trend="neutral" trendLabel="All deposit records" className="border-cyan-500/10" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => {
          const count = f === 'ALL' ? deposits.length : deposits.filter((d) => d.status === f).length;
          return (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              className={filter === f ? 'bg-emerald-600 text-white' : 'border-white/10 text-gray-400 hover:text-white'}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All' : STATUS_CONFIG[f]?.label || f} ({count})
            </Button>
          );
        })}
      </div>

      {/* Deposit History Table */}
      <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white">Deposit History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-emerald-400" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No deposits found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-3 text-left font-medium text-gray-400">Date</th>
                    <th className="pb-3 text-left font-medium text-gray-400">Source</th>
                    <th className="pb-3 text-right font-medium text-gray-400">Amount</th>
                    <th className="pb-3 text-left font-medium text-gray-400">Submitted By</th>
                    <th className="pb-3 text-center font-medium text-gray-400">Status</th>
                    {canApprove && <th className="pb-3 text-center font-medium text-gray-400">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((deposit) => {
                    const sc = STATUS_CONFIG[deposit.status] || STATUS_CONFIG.PENDING;
                    const isPending = deposit.status === 'PENDING';
                    const mayPresApprove = isPending && deposit.presidentStatus === 'PENDING' && canPresidentApprove;
                    const mayGsApprove = isPending && deposit.gsStatus === 'PENDING' && deposit.presidentStatus === 'APPROVED' && canGsApprove;
                    const mayPresReject = isPending && deposit.presidentStatus === 'PENDING' && canPresidentApprove;
                    const mayGsReject = isPending && deposit.gsStatus === 'PENDING' && canGsApprove;

                    return (
                      <tr key={deposit.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-3 text-gray-300">
                          {new Date(deposit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                            {DEPOSIT_SOURCE_LABELS[deposit.source] || deposit.source}
                          </Badge>
                        </td>
                        <td className="py-3 text-right font-semibold text-emerald-400">৳{deposit.amount.toLocaleString()}</td>
                        <td className="py-3 text-gray-300">{deposit.submitter?.name || '—'}</td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full ${sc.dotColor}`} />
                            <span className={`text-xs ${sc.color}`}>{sc.label}</span>
                          </div>
                          {/* Show partial approval status */}
                          {deposit.status === 'PENDING' && (
                            <div className="flex items-center justify-center gap-2 mt-1 text-[10px] text-gray-500">
                              <span className={deposit.presidentStatus === 'APPROVED' ? 'text-emerald-400' : ''}>
                                P: {deposit.presidentStatus === 'APPROVED' ? '✓' : '—'}
                              </span>
                              <span className={deposit.gsStatus === 'APPROVED' ? 'text-emerald-400' : ''}>
                                GS: {deposit.gsStatus === 'APPROVED' ? '✓' : '—'}
                              </span>
                            </div>
                          )}
                        </td>
                        {canApprove && (
                          <td className="py-3 text-center">
                            {isPending && (mayPresApprove || mayGsApprove || mayPresReject || mayGsReject) && (
                              <div className="flex items-center justify-center gap-1">
                                {mayPresApprove && (
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => handleApproval(deposit.id, 'PRESIDENT_APPROVE')}>
                                    <Shield className="h-3 w-3 mr-1" />P ✓
                                  </Button>
                                )}
                                {mayGsApprove && (
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => handleApproval(deposit.id, 'GS_APPROVE')}>
                                    <ShieldCheck className="h-3 w-3 mr-1" />GS ✓
                                  </Button>
                                )}
                                {mayPresReject && (
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleApproval(deposit.id, 'PRESIDENT_REJECT')}>
                                    <XCircle className="h-3 w-3 mr-1" />P ✗
                                  </Button>
                                )}
                                {mayGsReject && (
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleApproval(deposit.id, 'GS_REJECT')}>
                                    <XCircle className="h-3 w-3 mr-1" />GS ✗
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
