'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Shield, CheckCircle, XCircle, Clock, UserPlus,
  UserCheck, UserX, Hourglass, Download, Loader2, LayoutGrid, List,
  Eye, UserCog, GraduationCap, Calendar,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { User, UserRole, MembershipStatus } from '@/types';
import { ROLE_LABELS, MEMBERSHIP_STATUS_LABELS } from '@/types';
import { MembershipBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { exportToCSV } from '@/lib/export-utils';

const ROLE_AVATAR_COLORS: Record<UserRole, string> = {
  PRESIDENT: 'from-amber-500/40 to-amber-600/20 text-amber-400 border-amber-500/30',
  VP: 'from-purple-500/40 to-purple-600/20 text-purple-400 border-purple-500/30',
  GS: 'from-cyan-500/40 to-cyan-600/20 text-cyan-400 border-cyan-500/30',
  TREASURER: 'from-emerald-500/40 to-emerald-600/20 text-emerald-400 border-emerald-500/30',
  MEDIA: 'from-pink-500/40 to-pink-600/20 text-pink-400 border-pink-500/30',
  VERIFIER: 'from-blue-500/40 to-blue-600/20 text-blue-400 border-blue-500/30',
  MEMBER: 'from-gray-500/40 to-gray-600/20 text-gray-400 border-gray-500/30',
  GUEST: 'from-gray-500/40 to-gray-600/20 text-gray-400 border-gray-500/30',
  PLATFORM_ADMIN: 'from-red-500/40 to-red-600/20 text-red-400 border-red-500/30',
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

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

const canEditUserRole = (currentUser: User | null, targetUser: User) => {
  if (!currentUser) return false;
  if (targetUser.role === 'PLATFORM_ADMIN') return false;
  if (currentUser.role === 'PLATFORM_ADMIN') return true;
  if (currentUser.role === 'PRESIDENT') {
    return targetUser.role !== 'PRESIDENT';
  }
  return false;
};

const getAssignableRoles = (currentUser: User | null) => {
  if (!currentUser) return [];
  const allRoles = Object.entries(ROLE_LABELS);
  if (currentUser.role === 'PLATFORM_ADMIN') {
    return allRoles.filter(([k]) => k !== 'PLATFORM_ADMIN');
  }
  if (currentUser.role === 'PRESIDENT') {
    return allRoles.filter(([k]) => k !== 'PLATFORM_ADMIN' && k !== 'PRESIDENT');
  }
  return [];
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const gridContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const gridItem = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
};

type ViewMode = 'list' | 'grid';

export function MembersPage() {
  const { currentUser, setSelectedMemberId, setCurrentView } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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

  const handleViewProfile = (userId: string) => {
    setSelectedMemberId(userId);
    setCurrentView('profile');
  };

  // Member count stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.membershipStatus === 'ACTIVE').length,
    pending: users.filter(u => u.membershipStatus === 'PENDING').length,
    alumni: users.filter(u => u.membershipStatus === 'REJECTED' || u.membershipStatus === 'NON_MEMBER').length,
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
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <Users className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Members</h1>
              <p className="text-sm text-gray-400">Club member directory and management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-all ${
                  viewMode === 'list'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-all ${
                  viewMode === 'grid'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                disabled={exporting}
                onClick={() => {
                  setExporting(true);
                  setTimeout(() => {
                    exportToCSV(
                      users.map(u => ({
                        Name: u.name,
                        Email: u.email,
                        Role: ROLE_LABELS[u.role] || u.role,
                        Department: u.department || 'N/A',
                        Status: MEMBERSHIP_STATUS_LABELS[u.membershipStatus] || u.membershipStatus,
                        Joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
                      })),
                      'members-export',
                      [
                        { key: 'Name', label: 'Name' },
                        { key: 'Email', label: 'Email' },
                        { key: 'Role', label: 'Role' },
                        { key: 'Department', label: 'Department' },
                        { key: 'Status', label: 'Status' },
                        { key: 'Joined', label: 'Joined' },
                      ]
                    );
                    setExporting(false);
                  }, 300);
                }}
              >
                {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export CSV
              </Button>
            </motion.div>
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10"><GraduationCap className="h-4 w-4 text-violet-400" /></div>
          <div><p className="text-lg font-bold text-white">{stats.alumni}</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">Alumni</p></div>
        </motion.div>
      </div>

      {/* Filters */}
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

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />)}</div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {users.map((user) => {
            const avatarColor = ROLE_AVATAR_COLORS[user.role] || ROLE_AVATAR_COLORS.MEMBER;
            const deptColor = DEPARTMENT_COLORS[user.department || 'Other'] || DEPARTMENT_COLORS['Other'];
            const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
            return (
              <motion.div key={user.id} variants={item} layout whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                <Card className="border-white/5 bg-[#111]/60 backdrop-blur transition-all hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5 group">
                  <CardContent className="flex items-center gap-4 py-4 px-5">
                    {/* Gradient avatar with initials */}
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-gradient-to-br ${avatarColor} text-sm font-bold`}>
                      {initials}
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
                      {/* Member since date */}
                      {user.createdAt && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Calendar className="h-3 w-3 text-gray-600" />
                          <p className="text-[10px] text-gray-600">Member since {formatDate(user.createdAt)} &middot; {timeAgo(user.createdAt)}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Quick action: View Profile */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleViewProfile(user.id)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline text-xs">Profile</span>
                      </Button>
                      {/* Quick action: Assign Role (admin only) */}
                      {canChangeRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleViewProfile(user.id)}
                        >
                          <UserCog className="h-3.5 w-3.5 mr-1" />
                          <span className="hidden sm:inline text-xs">Role</span>
                        </Button>
                      )}
                      {canEditUserRole(currentUser, user) ? (
                        <Select value={user.role} onValueChange={(v) => handleRoleChange(user.id, v as UserRole)}>
                          <SelectTrigger className="h-8 w-[140px] border-white/10 bg-white/5 text-xs text-white"><SelectValue /></SelectTrigger>
                          <SelectContent className="border-white/10 bg-[#1a1a2e]">
                            {getAssignableRoles(currentUser).map(([k, v]) => (
                              <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                            ))}
                          </SelectContent>
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
      ) : (
        /* GRID VIEW */
        <motion.div variants={gridContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => {
            const avatarColor = ROLE_AVATAR_COLORS[user.role] || ROLE_AVATAR_COLORS.MEMBER;
            const deptColor = DEPARTMENT_COLORS[user.department || 'Other'] || DEPARTMENT_COLORS['Other'];
            const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
            return (
              <motion.div key={user.id} variants={gridItem} layout>
                <Card className="border-white/5 bg-[#111]/60 backdrop-blur transition-all hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5 group h-full">
                  <CardContent className="flex flex-col items-center py-6 px-5 text-center">
                    {/* Gradient avatar with initials */}
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 bg-gradient-to-br ${avatarColor} text-xl font-bold mb-3`}>
                      {initials}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{user.name}</p>
                      <MembershipBadge status={user.membershipStatus} />
                    </div>
                    {/* Role badge */}
                    <Badge variant="outline" className="border-white/10 text-[10px] text-gray-400 mb-2">
                      {ROLE_LABELS[user.role]}
                    </Badge>
                    {/* Department badge */}
                    {user.department && (
                      <Badge variant="outline" className={`text-[9px] border mb-2 ${deptColor}`}>
                        {user.department}
                      </Badge>
                    )}
                    <p className="text-xs text-gray-500 mb-2 truncate w-full">{user.email}</p>
                    {/* Member since */}
                    {user.createdAt && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Calendar className="h-3 w-3 text-gray-600" />
                        <p className="text-[10px] text-gray-600">Since {formatDate(user.createdAt)}</p>
                      </div>
                    )}
                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5 w-full justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 text-xs"
                        onClick={() => handleViewProfile(user.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />View
                      </Button>
                      {canChangeRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 text-xs"
                          onClick={() => handleViewProfile(user.id)}
                        >
                          <UserCog className="h-3 w-3 mr-1" />Role
                        </Button>
                      )}
                      {canApprove && user.membershipStatus === 'PENDING' && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(user.id, 'APPROVED')} className="bg-emerald-600 text-white h-7 text-xs px-2"><CheckCircle className="h-3 w-3" /></Button>
                          <Button size="sm" onClick={() => handleApprove(user.id, 'REJECTED')} variant="destructive" className="h-7 text-xs px-2"><XCircle className="h-3 w-3" /></Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {users.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-12 text-center">
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
