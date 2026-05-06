'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, UserX, Search, Clock, Mail, Building2, Hash } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { User } from '@/types';
import { MembershipBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MemberApprovalPage() {
  const { currentUser } = useAppStore();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const loadPending = async () => {
    setLoading(true);
    try { const r = await fetch('/api/users/approval'); const d = await r.json(); if (d.success) setPendingUsers(d.data.users || []); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { loadPending(); }, []);

  const handleAction = async (userId: string, action: 'APPROVED' | 'REJECTED') => {
    if (!currentUser) return;
    setProcessing(userId);
    try {
      const r = await fetch('/api/users/approval', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, approverId: currentUser.id }),
      });
      const d = await r.json();
      if (d.success) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (e) { console.error(e); } finally { setProcessing(null); }
  };

  const filtered = pendingUsers.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Member Approval</h1>
          <p className="text-sm text-gray-500">{filtered.length} pending approval{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="border-white/10 bg-white/5 pl-10 text-white" />
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-white/5" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <UserCheck className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">All Caught Up!</h3>
            <p className="text-sm text-gray-500 mt-1">No pending member approvals</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((user, i) => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xl font-bold">
                      {user.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                        <MembershipBadge status={user.membershipStatus} />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 mt-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Mail className="h-3.5 w-3.5 text-gray-600" />{user.email}
                        </div>
                        {user.department && <div className="flex items-center gap-2 text-sm text-gray-400"><Building2 className="h-3.5 w-3.5 text-gray-600" />{user.department}</div>}
                        {user.studentId && <div className="flex items-center gap-2 text-sm text-gray-400"><Hash className="h-3.5 w-3.5 text-gray-600" />{user.studentId}</div>}
                        <div className="flex items-center gap-2 text-sm text-gray-400"><Clock className="h-3.5 w-3.5 text-gray-600" />Applied {new Date(user.createdAt).toLocaleDateString()}</div>
                      </div>
                      {user.transactionId && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs">
                          <span className="text-gray-500">Transaction ID:</span>
                          <span className="font-mono text-emerald-400">{user.transactionId}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        onClick={() => handleAction(user.id, 'APPROVED')}
                        disabled={processing === user.id}
                        className="bg-emerald-600 text-white hover:bg-emerald-500 h-10"
                      >
                        <UserCheck className="mr-2 h-4 w-4" />Approve
                      </Button>
                      <Button
                        onClick={() => handleAction(user.id, 'REJECTED')}
                        disabled={processing === user.id}
                        variant="destructive"
                        className="h-10"
                      >
                        <UserX className="mr-2 h-4 w-4" />Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
