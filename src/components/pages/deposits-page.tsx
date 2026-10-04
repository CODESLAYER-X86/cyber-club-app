'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, Plus, Loader2, CheckCircle, XCircle,
  Eye, Landmark, Upload, Shield, ShieldCheck,
  ChevronDown, ChevronUp, ExternalLink,
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
import { cn } from '@/lib/utils';

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
  VOIDED: { color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/20', dotColor: 'bg-rose-400', label: 'Voided', emoji: '⛔' },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export function DepositsPage() {
  const { currentUser } = useAppStore();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [selectedVoidId, setSelectedVoidId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const loadDeposits = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const r = await fetch('/api/treasury/deposits');
      const d = await r.json();
      if (d.success) setDeposits(d.data.deposits || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (showSkeleton) setLoading(false);
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
        loadDeposits(false);
      } else {
        toast({ title: 'Error', description: d.error || 'Failed to submit deposit', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproval = async (depositId: string, action: string, reason?: string) => {
    if (!currentUser) return;
    try {
      const r = await fetch(`/api/treasury/deposits/${depositId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, approvedBy: currentUser.id, role: currentUser.role, reason }),
      });
      const d = await r.json();
      if (d.success) {
        toast({
          title: 'Success',
          description: action === 'VOID'
            ? 'Deposit has been voided and deducted from balance.'
            : `Deposit ${action.includes('REJECT') ? 'rejected' : 'approved'}`,
          variant: 'default',
        });
        loadDeposits(false);
      } else {
        toast({ title: 'Error', description: d.error || 'Action failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  };

  const handleConfirmVoid = async () => {
    if (!selectedVoidId || !voidReason.trim()) {
      toast({ title: 'Error', description: 'Please provide a reason for voiding', variant: 'destructive' });
      return;
    }
    setVoiding(true);
    await handleApproval(selectedVoidId, 'VOID', voidReason.trim());
    setVoiding(false);
    setVoidDialogOpen(false);
    setSelectedVoidId(null);
    setVoidReason('');
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
      <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar sm:flex-wrap">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'VOIDED'].map((f) => {
          const count = f === 'ALL' ? deposits.length : deposits.filter((d) => d.status === f).length;
          return (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              className={cn(
                'shrink-0 text-xs sm:text-sm',
                filter === f ? 'bg-emerald-600 text-white' : 'border-white/10 text-gray-400 hover:text-white'
              )}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All' : STATUS_CONFIG[f]?.label || f} ({count})
            </Button>
          );
        })}
      </div>

      {/* Void / Fallback Confirmation Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent className="border-white/10 bg-[#14141e] text-white w-[92vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" /> Revoke / Reject from Treasury
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-400">
              Revoking will reverse this deposit and subtract the amount from the live treasury balance. An audit entry and notification will be recorded.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300 font-semibold">Mandatory Reason / Note *</Label>
              <Textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. Inadvertent duplicate voucher or incorrect amount deposited"
                className="border-white/10 bg-white/5 min-h-[70px] text-xs text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setVoidDialogOpen(false)} className="border-white/10 text-gray-400">
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmVoid} disabled={voiding || !voidReason.trim()} className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold">
              {voiding ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Confirm Revocation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit History */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-emerald-400" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">No deposits found</p>
        ) : (
          filtered.map((deposit) => {
            const sc = STATUS_CONFIG[deposit.status] || STATUS_CONFIG.PENDING;
            const isPending = deposit.status === 'PENDING';
            const isApproved = deposit.status === 'APPROVED';
            const isExpanded = expandedId === deposit.id;
            const mayPresApprove = isPending && deposit.presidentStatus === 'PENDING' && canPresidentApprove;
            const mayGsApprove = isPending && deposit.gsStatus === 'PENDING' && deposit.presidentStatus === 'APPROVED' && canGsApprove;
            const mayPresReject = isPending && deposit.presidentStatus === 'PENDING' && canPresidentApprove;
            const mayGsReject = isPending && deposit.gsStatus === 'PENDING' && canGsApprove;
            const canVoidDeposit = isApproved && (canPresidentApprove || canGsApprove);

            return (
              <motion.div key={deposit.id} variants={item}>
                <Card className={`border-white/5 border-l-2 ${deposit.status === 'APPROVED' ? 'border-l-emerald-400' : deposit.status === 'VOIDED' ? 'border-l-rose-400' : deposit.status === 'REJECTED' ? 'border-l-red-400' : 'border-l-amber-400'} bg-[#111]/60 backdrop-blur transition-all hover:border-white/10`}>
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : deposit.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <Landmark className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[11px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-2 py-0.5">
                              {DEPOSIT_SOURCE_LABELS[deposit.source] || deposit.source}
                            </Badge>
                            {deposit.note && (
                              <p className="text-sm font-medium text-white truncate max-w-xs sm:max-w-md hidden sm:block">
                                {deposit.note}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(deposit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {deposit.submitter?.name && ` · By: ${deposit.submitter.name}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className={`text-sm sm:text-base font-semibold font-mono ${deposit.status === 'VOIDED' ? 'text-gray-500 line-through' : 'text-emerald-400'}`}>
                          ৳{deposit.amount.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/5">
                          <div className={`h-1.5 w-1.5 rounded-full ${sc.dotColor}`} />
                          <span className={`text-xs ${sc.color}`}>{sc.label}</span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 space-y-3 border-t border-white/5 pt-3">
                        {/* Note / Memo */}
                        {deposit.note && (
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-gray-300">
                            <span className="block mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Deposit Purpose / Description:</span>
                            <p className="leading-relaxed break-words">{deposit.note}</p>
                          </div>
                        )}

                        {/* Metadata & Sign-off Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-gray-400 bg-white/[0.02] border border-white/5 p-3 rounded-lg">
                          <div>
                            <span className="text-gray-500 block text-[11px]">Submitted By:</span>
                            <span className="text-gray-200 font-medium">
                              {deposit.submitter?.name || 'Treasurer'} {deposit.submitter?.role ? `(${deposit.submitter.role})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[11px]">President Review:</span>
                            <span className={deposit.presidentStatus === 'APPROVED' ? 'text-emerald-400 font-medium' : deposit.presidentStatus === 'REJECTED' ? 'text-red-400 font-medium' : 'text-amber-400 font-medium'}>
                              {deposit.presidentStatus} {deposit.presidentApprover ? `(${deposit.presidentApprover.name})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[11px]">General Secretary Review:</span>
                            <span className={deposit.gsStatus === 'APPROVED' ? 'text-emerald-400 font-medium' : deposit.gsStatus === 'REJECTED' ? 'text-red-400 font-medium' : 'text-amber-400 font-medium'}>
                              {deposit.gsStatus} {deposit.gsApprover ? `(${deposit.gsApprover.name})` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Deposit Voucher Attachment Link */}
                        {deposit.attachmentUrl && (
                          <div className="pt-0.5">
                            <a
                              href={deposit.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:underline bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-md font-medium"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> View Bank Deposit Slip / Voucher
                            </a>
                          </div>
                        )}

                        {/* Voided Details if VOIDED */}
                        {deposit.status === 'VOIDED' && (
                          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                            <span className="font-semibold text-rose-400 block mb-0.5">Voided Audit Record:</span>
                            Reversed by Executive Board & deducted from treasury balance.
                          </div>
                        )}

                        {/* Approval Actions */}
                        {canApprove && (
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                            {isPending && (
                              <>
                                {mayPresApprove && (
                                  <Button size="sm" className="h-8 bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-medium" onClick={() => handleApproval(deposit.id, 'PRESIDENT_APPROVE')}>
                                    <Shield className="h-3.5 w-3.5 mr-1.5" />President Approve
                                  </Button>
                                )}
                                {mayGsApprove && (
                                  <Button size="sm" className="h-8 bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-medium" onClick={() => handleApproval(deposit.id, 'GS_APPROVE')}>
                                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />GS Approve
                                  </Button>
                                )}
                                {mayPresReject && (
                                  <Button size="sm" variant="outline" className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium" onClick={() => handleApproval(deposit.id, 'PRESIDENT_REJECT')}>
                                    <XCircle className="h-3.5 w-3.5 mr-1.5" />President Reject
                                  </Button>
                                )}
                                {mayGsReject && (
                                  <Button size="sm" variant="outline" className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium" onClick={() => handleApproval(deposit.id, 'GS_REJECT')}>
                                    <XCircle className="h-3.5 w-3.5 mr-1.5" />GS Reject
                                  </Button>
                                )}
                              </>
                            )}
                            {canVoidDeposit && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-mono"
                                onClick={() => {
                                  setSelectedVoidId(deposit.id);
                                  setVoidReason('');
                                  setVoidDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1.5" /> Revoke / Reject from Treasury
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
