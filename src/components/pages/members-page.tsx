'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, CheckCircle, XCircle, Clock, UserPlus, UserCheck, UserX, Hourglass } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { User, UserRole, MembershipStatus } from '@/types';
import { ROLE_LABELS, MEMBERSHIP_STATUS_LABELS } from '@/types';
import { MembershipBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const ROLE_AVATAR_COLORS: Record<UserRole, string> = {
  PRESIDENT: 'bg-gradient-to-br from-amber-500/30 to-amber-600/20 text-amber-400 border-amber-500/20',
  VP: 'bg-gradient-to-br from-purple-500/30 to-purple-600/20 text-purple-400 border-purple-500/20',
  GS: 'bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 text-cyan-400 border-cyan-500/20',
  TREASURER: 'bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 text-emerald-400 border-emerald-500/20',
  MEDIA: 'bg-gradient-to-br from-pink-500/30 to-pink-600/20 text-pink-400 border-pink-500/20',
  VERIFIER: 'bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-blue-400 border-blue-500/20',
  MEMBER: 'bg-gradient-to-br from-gray-500/30 to-gray-600/20 text-gray-400 border-gray-500/20',
  GUEST: 'bg-gradient-to-br from-gray-500/30 to-gray-600/20 text-gray-400 border-gray-500/20',
  PLATFORM_ADMIN: 'bg-gradient-to-br from-red-500/30 to-red-600/20 text-red-400 border-red-500/20',
};

const DEPARTMENT_COLORS: Record<string, string> = {
  'Computer Science': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'IT': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Electrical Engineering': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Software Engineering': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Cybersecurity': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Other': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

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
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

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

  // Member count stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.membershipStatus === 'ACTIVE').length,
    pending: users.filter(u => u.membershipStatus === 'PENDING').length,
    rejected: users.filter(u => u.membershipStatus === 'REJECTED').length,
  }), [users]);

  return (
    <div className="space-y-6">
      {/* Gradient Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/15 to-emerald-600/10 border border-emerald-500/10 p-6"
      >
        {/* SVG Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
        {/* Blur Orbs */}
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
            <Users className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Members</h1>
            <p className="text-sm text-gray-400">Club member directory and management</p>
          </div>
        </div>
      </motion.div>

      {/* Member Count Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#111]/60 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10"><UserPlus className="h-4 w-4 text-emerald-400" /></div>
          <div><p className="text-lg font-bold text-white">{stats.total}</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#111]/60 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10"><UserCheck className="h-4 w-4 text-cyan-400" /></div>
          <div><p className="text-lg font-bold text-white">{stats.active}</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">Active</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#111]/60 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10"><Hourglass className="h-4 w-4 text-amber-400" /></div>
          <div><p className="text-lg font-bold text-white">{stats.pending}</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">Pending</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#111]/60 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10"><UserX className="h-4 w-4 text-red-400" /></div>
          <div><p className="text-lg font-bold text-white">{stats.rejected}</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">Rejected</p></div>
        </motion.div>
      </div>

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
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {users.map((user) => {
            const avatarColor = ROLE_AVATAR_COLORS[user.role] || ROLE_AVATAR_COLORS.MEMBER;
            const deptColor = DEPARTMENT_COLORS[user.department || 'Other'] || DEPARTMENT_COLORS['Other'];
            return (
              <motion.div key={user.id} variants={item} layout whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                <Card className="border-white/5 bg-[#111]/60 backdrop-blur transition-all hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5">
                  <CardContent className="flex items-center gap-4 py-4">
                    {/* Role-specific gradient avatar */}
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${avatarColor} text-sm font-bold`}>
                      {user.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{user.name}</p>
                        <MembershipBadge status={user.membershipStatus} />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {/* Department badge */}
                        {user.department && (
                          <Badge variant="outline" className={`text-[9px] border ${deptColor}`}>
                            {user.department}
                          </Badge>
                        )}
                      </div>
                      {/* Joined time */}
                      {user.createdAt && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-gray-600" />
                          <p className="text-[10px] text-gray-600">Joined {timeAgo(user.createdAt)}</p>
                        </div>
                      )}
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
            );
          })}
          {users.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/5 mb-4">
                <Users className="h-8 w-8 text-gray-600" />
              </div>
              <p className="text-gray-500">No members found</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
