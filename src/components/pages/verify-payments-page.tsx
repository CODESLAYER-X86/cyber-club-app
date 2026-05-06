'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, CreditCard, Search } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Payment } from '@/types';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      const r = await fetch(`/api/payments?${params}`); const d = await r.json(); if (d.success) setPayments(d.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { loadPayments(); }, [typeFilter]);

  const handleVerify = async (id: string, action: 'VERIFIED' | 'REJECTED') => {
    if (!currentUser) return;
    try {
      const r = await fetch(`/api/payments/${id}/verify`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: action, verifiedBy: currentUser.id }) });
      const d = await r.json(); if (d.success) loadPayments();
    } catch (e) { console.error(e); }
  };

  const filtered = payments.filter(p => !search || p.transactionId.toLowerCase().includes(search.toLowerCase()) || p.user?.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Verify Payments</h1><p className="text-sm text-gray-500">Review and verify payment submissions</p></div>

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

      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-white/5" />)}</div> : (
        <div className="space-y-3">
          {filtered.map((payment) => (
            <motion.div key={payment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10"><CreditCard className="h-5 w-5 text-amber-400" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{payment.user?.name || 'Unknown'}</p>
                      <StatusBadge type="payment" status={payment.status} />
                    </div>
                    <p className="text-xs text-gray-500">{payment.type} • ৳{payment.amount.toLocaleString()} • TXN: {payment.transactionId}</p>
                    <p className="text-xs text-gray-600">{new Date(payment.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleVerify(payment.id, 'VERIFIED')} className="bg-emerald-600 text-white h-8 text-xs"><CheckCircle className="mr-1 h-3 w-3" />Verify</Button>
                    <Button size="sm" onClick={() => handleVerify(payment.id, 'REJECTED')} variant="destructive" className="h-8 text-xs"><XCircle className="mr-1 h-3 w-3" />Reject</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="py-12 text-center text-gray-500">No pending payments</p>}
        </div>
      )}
    </div>
  );
}
