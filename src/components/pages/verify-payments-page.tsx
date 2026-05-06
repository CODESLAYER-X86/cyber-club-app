'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, CreditCard, Search, Clock,
  DollarSign, UserCheck, Calendar, ShieldCheck,
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
  const [search, setSearch] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: 'PENDING' });
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const r = await fetch(`/api/payments?${params}`);
      const d = await r.json();
      if (d.success) setPayments(d.data.payments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadPayments(); }, [typeFilter]);

  const handleVerify = async (id: string, action: 'VERIFIED' | 'REJECTED') => {
    if (!currentUser) return;
    try {
      // API expects 'action' field with 'VERIFY' or 'REJECT' (not 'VERIFIED'/'REJECTED')
      const apiAction = action === 'VERIFIED' ? 'VERIFY' : 'REJECT';
      const r = await fetch(`/api/payments/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: apiAction, verifiedBy: currentUser.id }),
      });
      const d = await r.json();
      if (d.success) {
        loadPayments();
        toast({ title: 'Payment updated', description: `Payment has been ${action.toLowerCase()} successfully.` });
      } else {
        toast({ title: 'Update failed', description: d.error || 'Could not update payment', variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Update failed', description: 'Network error', variant: 'destructive' });
    }
  };

  const filtered = payments.filter(p =>
    !search || p.transactionId.toLowerCase().includes(search.toLowerCase()) || p.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Computed stats
  const pendingCount = payments.length;
  const totalAmountPending = payments.reduce((s, p) => s + p.amount, 0);
  const verifiedToday = payments.filter(p => {
    const d = new Date(p.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

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
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
            <CreditCard className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Verify Payments</h1>
            <p className="text-sm text-gray-400">Review and verify payment submissions</p>
          </div>
        </div>
      </motion.div>

      {/* Payment Stats Bar */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Clock} label="Pending Count" value={pendingCount.toString()} trend={pendingCount > 5 ? 'down' : 'up'} delay={0} />
        <StatCard icon={DollarSign} label="Total Amount Pending" value={`৳${totalAmountPending.toLocaleString()}`} delay={0.05} />
        <StatCard icon={UserCheck} label="Verified Today" value={verifiedToday.toString()} trend="up" delay={0.1} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or transaction ID..." className="border-white/10 bg-white/5 pl-10 text-white" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] border-white/10 bg-white/5 text-white"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent className="border-white/10 bg-[#1a1a2e]">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="MEMBERSHIP">Membership</SelectItem>
            <SelectItem value="EVENT">Event</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State with illustration */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/5 mb-4">
            <ShieldCheck className="h-10 w-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-1">No pending payments</h3>
          <p className="text-sm text-gray-600 max-w-xs">
            All payments have been reviewed. New submissions will appear here automatically.
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
                      <p className="text-xs text-gray-500">৳{payment.amount.toLocaleString()} • TXN: {payment.transactionId}{payment.event ? ` • Event: ${payment.event.title}` : ''}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {timeAgo(payment.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={() => handleVerify(payment.id, 'VERIFIED')} className="bg-emerald-600 text-white h-8 text-xs">
                        <CheckCircle className="mr-1 h-3 w-3" />Verify
                      </Button>
                      <Button size="sm" onClick={() => handleVerify(payment.id, 'REJECTED')} variant="destructive" className="h-8 text-xs">
                        <XCircle className="mr-1 h-3 w-3" />Reject
                      </Button>
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
