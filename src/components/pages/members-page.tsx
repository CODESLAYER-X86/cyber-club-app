'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { User, UserRole } from '@/types';
import { ROLE_LABELS, MEMBERSHIP_STATUS_LABELS } from '@/types';
import { MembershipBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export function MembersPage() {
  const { currentUser } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const canApprove = currentUser && ['PRESIDENT', 'GS', 'PLATFORM_ADMIN'].includes(currentUser.role);
  const canChangeRole = currentUser && ['PRESIDENT', 'PLATFORM_ADMIN'].includes(currentUser.role);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (roleFilter !== 'all') params.set('role', roleFilter);
        if (statusFilter !== 'all') params.set('membershipStatus', statusFilter);
        if (search) params.set('search', search);
        const r = await fetch(`/api/users?${params}`); const d = await r.json(); if (d.success) setUsers(d.data.users || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [roleFilter, statusFilter, search]);

  const handleApprove = async (userId: string, action: 'APPROVED' | 'REJECTED') => {
    if (!currentUser) return;
    try {
      const r = await fetch('/api/users/approval', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action, approverId: currentUser.id }) });
      const d = await r.json(); if (d.success) setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e) { console.error(e); }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    if (!currentUser) return;
    try {
      const r = await fetch(`/api/users/${userId}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, updatedBy: currentUser.id }) });
      const d = await r.json(); if (d.success) setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Members</h1><p className="text-sm text-gray-500">Club member directory and management</p></div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="border-white/10 bg-white/5 pl-10 text-white" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px] border-white/10 bg-white/5 text-white"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent className="border-white/10 bg-[#1a1a2e]">
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] border-white/10 bg-white/5 text-white"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="border-white/10 bg-[#1a1a2e]">
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(MEMBERSHIP_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />)}</div> : (
        <div className="space-y-3">
          {users.map((user) => (
            <motion.div key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold">{user.name?.charAt(0) || '?'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{user.name}</p>
                      <MembershipBadge status={user.membershipStatus} />
                    </div>
                    <p className="text-xs text-gray-500">{user.email} • {user.department || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {canChangeRole ? (
                      <Select value={user.role} onValueChange={(v) => handleRoleChange(user.id, v as UserRole)}>
                        <SelectTrigger className="h-8 w-[140px] border-white/10 bg-white/5 text-xs text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#1a1a2e]">{Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="border-white/10 text-xs text-gray-400">{ROLE_LABELS[user.role]}</Badge>
                    )}
                    {canApprove && user.membershipStatus === 'PENDING' && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleApprove(user.id, 'APPROVED')} className="bg-emerald-600 text-white h-7 text-xs px-2"><CheckCircle className="h-3 w-3" /></Button>
                        <Button size="sm" onClick={() => handleApprove(user.id, 'REJECTED')} variant="destructive" className="h-7 text-xs px-2"><XCircle className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {users.length === 0 && <p className="py-12 text-center text-gray-500">No members found</p>}
        </div>
      )}
    </div>
  );
}
