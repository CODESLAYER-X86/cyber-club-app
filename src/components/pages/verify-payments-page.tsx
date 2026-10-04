'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, CreditCard, Search, Clock,
  DollarSign, UserCheck, Calendar, ShieldCheck, Loader2,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Payment } from '@/types';
import { PaymentBadge } from '@/components/shared/status-badge';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const PAYMENT_TYPE_BADGE: Record<string, { label: string; badgeClass: string }> = {
  MEMBERSHIP: { label: 'Membership', badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  EVENT: { label: 'Event', badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
  OTHER: { label: 'Other', badgeClass: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
};

const STATUS_BORDER: Record<string, string> = {
  PENDING: 'border-l-amber-400',
  APPROVED: 'border-l-emerald-400',
  VERIFIED: 'border-l-emerald-400',
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

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function VerifyPaymentsPage() {
  const { currentUser } = useAppStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const isAuthorized = currentUser && ['TREASURER', 'PRESIDENT', 'GS', 'PLATFORM_ADMIN', 'VERIFIER'].includes(currentUser.role);

  const loadPayments = async (showSkeleton = true) => {
    if (!isAuthorized) return;
    if (showSkeleton) setLoading(true);
    try {
      const params = new URLSearchParams();
      const statusParam =
        statusFilter === 'ALL'
          ? 'PENDING,APPROVED,VERIFIED,REJECTED'
          : statusFilter === 'VERIFIED'
          ? 'VERIFIED,APPROVED'
          : statusFilter;

      params.set('status', statusParam);

      if (currentUser?.role === 'VERIFIER') {
        params.set('type', 'EVENT');
      } else if (typeFilter !== 'all') {
        params.set('type', typeFilter);
      }

      const r = await fetch(`/api/payments?${params}`);
      const d = await r.json();
      if (d.success) setPayments(d.data.payments || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };
  useEffect(() => { loadPayments(); }, [typeFilter, statusFilter]);

  if (!isAuthorized) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center p-6 space-y-4">
        <ShieldCheck className="h-16 w-16 text-red-500/80 animate-pulse" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Only the Treasurer, President, General Secretary, Platform Admin, and Event Verifiers can access verify payments.
        </p>
      </div>
    );
  }

  const handleVerify = async (id: string, action: 'VERIFIED' | 'REJECTED') => {
    if (!currentUser) return;

    // Optimistic in-place update
    const targetStatus = action === 'VERIFIED' ? (currentUser.role === 'VERIFIER' ? 'APPROVED' : 'VERIFIED') : 'REJECTED';
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: targetStatus } : p));

    try {
      // API expects 'action' field with 'VERIFY' or 'REJECT'
      const apiAction = action === 'VERIFIED' ? 'VERIFY' : 'REJECT';
      const r = await fetch(`/api/payments/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: apiAction, verifiedBy: currentUser.id }),
      });
      const d = await r.json();
      if (d.success) {
        loadPayments(false);
        const actionLabel = action === 'VERIFIED' ? (currentUser.role === 'VERIFIER' ? 'approved' : 'verified') : 'rejected';
        toast({ title: 'Payment updated', description: `Payment has been ${actionLabel} successfully.` });
      } else {
        loadPayments(false);
        toast({ title: 'Update failed', description: d.error || 'Could not update payment', variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      loadPayments(false);
      toast({ title: 'Update failed', description: 'Network error', variant: 'destructive' });
    }
  };

  const filtered = payments.filter(p => {
    const matchesSearch = !search || p.transactionId.toLowerCase().includes(search.toLowerCase()) || p.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'VERIFIED' ? (p.status === 'VERIFIED' || p.status === 'APPROVED') : p.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  // Computed stats
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;
  const totalAmountPending = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);
  const verifiedToday = payments.filter(p => {
    const d = new Date(p.createdAt);
    const now = new Date();
    return (p.status === 'VERIFIED' || p.status === 'APPROVED') && d.toDateString() === now.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-[#0a1a12] via-[#0d1f17] to-[#0a1410] p-6 shadow-xl"
        style={{ backgroundImage: `url("${SVG_PATTERN}")` }}
      >
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Payment Verification Desk</h1>
            </div>
            <p className="text-xs text-gray-400 max-w-lg">
              Review, verify, or re-evaluate membership and workshop dues. Correct mistakes in real time.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Payment Stats Bar */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Clock} label="Pending Review" value={pendingCount.toString()} trend={pendingCount > 5 ? 'down' : 'up'} delay={0} />
        <StatCard icon={DollarSign} label="Pending Amount" value={`৳${totalAmountPending.toLocaleString()}`} delay={0.05} />
        <StatCard icon={UserCheck} label="Verified Today" value={verifiedToday.toString()} trend="up" delay={0.1} />
      </div>

      {/* Status Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'PENDING', label: 'Pending' },
            { key: 'VERIFIED', label: 'Verified / Approved' },
            { key: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === tab.key
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Type Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Txn ID or Name..." className="border-white/10 bg-white/5 pl-9 text-white h-9 text-xs" />
          </div>
          {currentUser?.role !== 'VERIFIER' && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] border-white/10 bg-white/5 text-white h-9 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent className="border-white/10 bg-[#1a1a2e]">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="MEMBERSHIP">Membership</SelectItem>
                <SelectItem value="EVENT">Event</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Payment Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/5 mb-4">
            <ShieldCheck className="h-10 w-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-1">No payments match criteria</h3>
          <p className="text-sm text-gray-600 max-w-xs">
            Try adjusting your search or status filter tabs to inspect records.
          </p>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {filtered.map((payment) => {
            const typeConfig = PAYMENT_TYPE_BADGE[payment.type] || PAYMENT_TYPE_BADGE.OTHER;
            const borderColor = STATUS_BORDER[payment.status] || 'border-l-gray-500';
            const initials = getInitials(payment.user?.name);

            return (
              <motion.div key={payment.id} variants={item} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                <Card className={`border-white/5 border-l-2 ${borderColor} bg-[#111]/60 backdrop-blur transition-all hover:border-white/10 hover:shadow-lg hover:shadow-emerald-500/5`}>
                  <CardContent className="flex items-center gap-4 py-4">
                    {/* Avatar with initials */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-white">{payment.user?.name || 'Unknown'}</p>
                        <PaymentBadge status={payment.status} />
                        <Badge variant="outline" className={`text-[10px] ${typeConfig.badgeClass}`}>
                          {typeConfig.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">৳{payment.amount.toLocaleString()} • TXN: <span className="text-white font-mono">{payment.transactionId}</span> • Method: {payment.paymentMethod === 'PREVIOUS_MEMBER' ? 'Previous Member' : (payment.paymentMethod || 'bKash')}{payment.event ? ` • Event: ${payment.event.title}` : ''}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {timeAgo(payment.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      {payment.status === 'PENDING' ? (
                        <>
                          <Button size="sm" onClick={() => handleVerify(payment.id, 'VERIFIED')} className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs font-medium">
                            <CheckCircle className="mr-1 h-3.5 w-3.5" />{currentUser?.role === 'VERIFIER' ? 'Approve' : 'Verify'}
                          </Button>
                          <Button size="sm" onClick={() => handleVerify(payment.id, 'REJECTED')} variant="destructive" className="h-8 text-xs font-medium">
                            <XCircle className="mr-1 h-3.5 w-3.5" />Reject
                          </Button>
                        </>
                      ) : payment.status === 'VERIFIED' ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 flex items-center gap-1 select-none font-mono">
                            <CheckCircle className="h-3 w-3" /> Verified
                          </Badge>
                          {currentUser && ['TREASURER', 'PRESIDENT', 'PLATFORM_ADMIN'].includes(currentUser.role) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerify(payment.id, 'REJECTED')}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs h-8"
                              title="Reject if verified by mistake"
                            >
                              <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                            </Button>
                          )}
                        </div>
                      ) : payment.status === 'APPROVED' ? (
                        /* APPROVED Payment (verified by Event Verifier) */
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 flex items-center gap-1 select-none font-mono">
                            <CheckCircle className="h-3 w-3" /> Approved
                          </Badge>
                          {currentUser && ['TREASURER', 'PRESIDENT', 'PLATFORM_ADMIN', 'GS', 'VERIFIER'].includes(currentUser.role) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerify(payment.id, 'REJECTED')}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs h-8"
                              title="Reject if approved by mistake"
                            >
                              <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                            </Button>
                          )}
                        </div>
                      ) : (
                        /* REJECTED Payment with Re-evaluation action */
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-2.5 py-1 flex items-center gap-1 select-none font-mono">
                            <XCircle className="h-3 w-3" /> Rejected
                          </Badge>
                          {currentUser && ['TREASURER', 'PRESIDENT', 'PLATFORM_ADMIN', 'GS', 'VERIFIER'].includes(currentUser.role) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerify(payment.id, 'VERIFIED')}
                              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 text-xs h-8 font-medium"
                              title="Re-verify if rejected by mistake"
                            >
                              <CheckCircle className="mr-1 h-3.5 w-3.5" /> Re-verify
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
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

