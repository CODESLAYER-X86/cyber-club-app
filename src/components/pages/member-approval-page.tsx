'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, UserX, Search, Clock, Mail, Building2, Hash, CheckCircle, XCircle, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { User } from '@/types';
import { MembershipBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

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
  return `${days}d ago`;
}

export function MemberApprovalPage() {
  const { currentUser } = useAppStore();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);

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
        setSelectedIds(prev => { const next = new Set(prev); next.delete(userId); return next; });
        toast({
          title: action === 'APPROVED' ? 'Member Approved' : 'Member Rejected',
          description: action === 'APPROVED'
            ? 'The member has been approved and notified.'
            : 'The membership application has been rejected.',
          variant: action === 'APPROVED' ? 'default' : 'destructive',
        });
      } else {
        toast({ title: 'Error', description: d.error || 'Failed to process request.', variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    } finally { setProcessing(null); }
  };

  const handleBatchAction = async (action: 'APPROVED' | 'REJECTED') => {
    if (!currentUser || selectedIds.size === 0) return;
    setBatchProcessing(true);
    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map(userId =>
          fetch('/api/users/approval', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, action, approverId: currentUser.id }),
          })
        )
      );
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      setPendingUsers(prev => prev.filter(u => !selectedIds.has(u.id)));
      setSelectedIds(new Set());
      toast({
        title: `Batch ${action === 'APPROVED' ? 'Approval' : 'Rejection'} Complete`,
        description: `${successCount} of ${results.length} ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully.`,
      });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Batch operation failed.', variant: 'destructive' });
    } finally { setBatchProcessing(false); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(u => u.id)));
    }
  };

  const filtered = pendingUsers.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  // Urgency indicator: applications older than 3 days
  const getUrgency = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days >= 7) return { level: 'critical', label: `${days}d overdue`, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
    if (days >= 3) return { level: 'warning', label: `${days}d waiting`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    return { level: 'normal', label: timeAgo(createdAt), color: 'text-gray-500', bg: '' };
  };

  return (
    <div className="space-y-6">
      {/* Gradient Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-600/20 via-orange-600/15 to-amber-600/10 border border-amber-500/10 p-6"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/20">
              <Shield className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">Member Approval</h1>
                {filtered.length > 0 && (
                  <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20">
                    {filtered.length} pending
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-400">Review and approve new member applications</p>
            </div>
          </div>
          {filtered.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                onClick={selectAll}
              >
                {selectedIds.size === filtered.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Batch Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3"
          >
            <span className="text-sm text-amber-400 font-medium">{selectedIds.size} selected</span>
            <div className="flex-1" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-500"
                  disabled={batchProcessing}
                >
                  {batchProcessing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="mr-2 h-3.5 w-3.5" />}
                  Approve All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-white/10 bg-[#1a1a2e] text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                    Batch Approve Members
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Are you sure you want to approve {selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''}? They will gain access to the platform immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-white/10 text-gray-400 hover:bg-white/5">Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-emerald-600 text-white hover:bg-emerald-500" onClick={() => handleBatchAction('APPROVED')}>
                    Approve {selectedIds.size} Member{selectedIds.size !== 1 ? 's' : ''}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={batchProcessing}
                >
                  {batchProcessing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <XCircle className="mr-2 h-3.5 w-3.5" />}
                  Reject All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-white/10 bg-[#1a1a2e] text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    Batch Reject Members
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Are you sure you want to reject {selectedIds.size} application{selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-white/10 text-gray-400 hover:bg-white/5">Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 text-white hover:bg-red-500" onClick={() => handleBatchAction('REJECTED')}>
                    Reject {selectedIds.size} Application{selectedIds.size !== 1 ? 's' : ''}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="border-white/10 bg-white/5 pl-10 text-white" />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-40 animate-pulse rounded-xl bg-white/5" />)}</div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <UserCheck className="h-10 w-10 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">All Caught Up!</h3>
              <p className="text-sm text-gray-500 mt-1">No pending member approvals</p>
              <p className="text-xs text-gray-600 mt-2">New applications will appear here for review</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filtered.map((user, i) => {
            const urgency = getUrgency(user.createdAt);
            const isSelected = selectedIds.has(user.id);
            const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                layout
              >
                <Card className={`border-white/5 bg-[#111]/60 backdrop-blur transition-all hover:border-white/10 ${isSelected ? 'ring-1 ring-amber-500/30 border-amber-500/20' : ''}`}>
                  <CardContent className="pt-6 pb-5">
                    <div className="flex items-start gap-4">
                      {/* Checkbox + Avatar */}
                      <div className="flex flex-col items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(user.id)}
                          className="h-4 w-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/30 cursor-pointer"
                        />
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-500/20 text-amber-400 text-lg font-bold">
                          {initials}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + Badges Row */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                          <MembershipBadge status={user.membershipStatus} />
                          {urgency.level !== 'normal' && (
                            <Badge variant="outline" className={`text-[10px] border ${urgency.bg} ${urgency.color}`}>
                              <Clock className="h-2.5 w-2.5 mr-1" />
                              {urgency.label}
                            </Badge>
                          )}
                        </div>

                        {/* Details Grid */}
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Mail className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.department && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Building2 className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                              <span>{user.department}</span>
                            </div>
                          )}
                          {user.studentId && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Hash className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                              <span className="font-mono">{user.studentId}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                            <span>Applied {timeAgo(user.createdAt)}</span>
                          </div>
                        </div>

                        {/* Transaction ID */}
                        {user.transactionId && (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs">
                            <span className="text-gray-500">Transaction:</span>
                            <span className="font-mono text-emerald-400">{user.transactionId}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex shrink-0 gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              disabled={processing === user.id}
                              className="bg-emerald-600 text-white hover:bg-emerald-500 h-10"
                            >
                              {processing === user.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                              Approve
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-white/10 bg-[#1a1a2e] text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Approve Member</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Are you sure you want to approve <span className="text-white font-medium">{user.name}</span>? They will gain access to the platform immediately.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/10 text-gray-400 hover:bg-white/5">Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-emerald-600 text-white hover:bg-emerald-500" onClick={() => handleAction(user.id, 'APPROVED')}>
                                Approve
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              disabled={processing === user.id}
                              variant="destructive"
                              className="h-10"
                            >
                              {processing === user.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
                              Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-white/10 bg-[#1a1a2e] text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                                Reject Application
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Are you sure you want to reject <span className="text-white font-medium">{user.name}</span>&apos;s application? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/10 text-gray-400 hover:bg-white/5">Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 text-white hover:bg-red-500" onClick={() => handleAction(user.id, 'REJECTED')}>
                                Reject
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
