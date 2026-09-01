'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Hash, Building2, Phone, Edit3, Save, Calendar,
  Award, CreditCard, Clock, Camera, Activity,
  XCircle, Loader2, ShieldCheck, UserCheck, Layers, BookOpen,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { ROLE_LABELS, MEMBERSHIP_STATUS_LABELS, User } from '@/types';
import { MembershipBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { DigitalIdCard } from '@/components/shared/digital-id-card';
import { formatDeptShort } from '@/utils/export-attendees-pdf';

interface ProfileStats {
  eventsAttended: number;
  certificates: number;
  payments: number;
}

interface ActivityItem {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

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
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(date).toLocaleDateString();
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function ProfilePage() {
  const { currentUser, selectedMemberId, setSelectedMemberId, setCurrentView, updateCurrentUser } = useAppStore();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    bio: '',
    studentId: '',
    rollNumber: '',
    batch: '',
    department: '',
  });
  const [stats, setStats] = useState<ProfileStats>({ eventsAttended: 0, certificates: 0, payments: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const isViewingSelf = !selectedMemberId || selectedMemberId === currentUser?.id;
  const userToShow = isViewingSelf ? currentUser : profileUser;
  const isMember = userToShow?.membershipStatus === 'ACTIVE' || ['PLATFORM_ADMIN', 'PRESIDENT', 'SECRETARY', 'TREASURER', 'EXECUTIVE_MEMBER'].includes(userToShow?.role || '');

  // Clear selectedMemberId on unmount
  useEffect(() => {
    return () => {
      setSelectedMemberId(null);
    };
  }, [setSelectedMemberId]);

  // Fetch stats and user info dynamically
  const fetchProfileUser = useCallback(async () => {
    const targetId = selectedMemberId || currentUser?.id;
    if (!targetId) return;
    setProfileLoading(true);
    setStatsLoading(true);
    try {
      const userRes = await fetch(`/api/users/${targetId}`);
      const userData = await userRes.json();

      if (userData.success && userData.data?.user) {
        const user = userData.data.user;
        if (!isViewingSelf) {
          setProfileUser(user);
        }
        setForm({
          name: user.name || '',
          phone: user.phone || '',
          bio: user.bio || '',
          studentId: user.studentId || '',
          rollNumber: user.rollNumber || '',
          batch: user.batch || '',
          department: user.department || '',
        });
        setStats({
          eventsAttended: user.eventRegistrations?.length || 0,
          certificates: user.certificates?.length || 0,
          payments: user.payments?.length || 0,
        });
      }
    } catch (e) {
      console.error('Failed to fetch profile user details', e);
    } finally {
      setProfileLoading(false);
      setStatsLoading(false);
    }
  }, [selectedMemberId, currentUser?.id, isViewingSelf]);

  // Fetch recent activity
  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success && data.data?.recentActivity) {
        setRecentActivity(data.data.recentActivity.slice(0, 5));
      }
    } catch (e) {
      console.error('Failed to fetch recent activity', e);
    }
  }, []);

  useEffect(() => {
    fetchProfileUser();
    fetchActivity();
  }, [fetchProfileUser, fetchActivity]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          bio: form.bio,
          studentId: form.studentId,
          rollNumber: form.rollNumber,
          batch: form.batch,
          department: form.department,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.user) {
        updateCurrentUser(data.data.user);
        setEditing(false);
      }
    } catch (e) {
      console.error('Failed to save profile', e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (userToShow) {
      setForm({
        name: userToShow.name || '',
        phone: userToShow.phone || '',
        bio: userToShow.bio || '',
        studentId: userToShow.studentId || '',
        rollNumber: userToShow.rollNumber || '',
        batch: userToShow.batch || '',
        department: userToShow.department || '',
      });
    }
    setEditing(false);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-gray-500 font-mono">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (!userToShow) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-gray-400">User not found</p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedMemberId(null);
              setCurrentView('dashboard');
            }}
          >
            Back to Hub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-5xl mx-auto pb-12"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            {isViewingSelf ? 'My Profile & Credentials' : `${userToShow.name}'s Profile`}
          </h1>
          <p className="text-sm text-gray-400 font-mono mt-0.5">
            {isMember ? 'Verified Club Operative Record' : 'Guest Account Profile'}
          </p>
        </div>

        {isViewingSelf && (
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 font-mono text-xs"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                Edit Profile
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Profile Info Card */}
      <motion.div variants={item}>
        <Card className="overflow-hidden border-white/5 bg-[#111]/60 backdrop-blur">
          <div className="h-28 bg-gradient-to-r from-emerald-600/30 via-cyan-600/20 to-emerald-600/10 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
          </div>

          <CardContent className="relative pt-0 pb-6">
            {/* Avatar & Header */}
            <div className="flex items-end gap-6 -mt-14">
              <div className="relative group">
                <div className="rounded-full p-[3px] bg-gradient-to-br from-emerald-400 via-cyan-400 to-emerald-500">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#111] text-emerald-400 text-4xl font-bold border-2 border-[#111]">
                    {userToShow.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-[3px] border-[#111]">
                  <div className="h-full w-full rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>

              <div className="flex-1 pb-1">
                <div className="flex items-center gap-3 flex-wrap">
                  {editing ? (
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      className="border-white/10 bg-white/5 text-white text-xl font-bold max-w-xs"
                      placeholder="Full name"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-white">{userToShow.name}</h2>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{userToShow.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                    {ROLE_LABELS[userToShow.role]}
                  </Badge>
                  <MembershipBadge status={userToShow.membershipStatus} />
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="mt-6">
              {editing ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Bio</label>
                  <Textarea
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    className="border-white/10 bg-white/5 text-white min-h-[80px] resize-none"
                    placeholder="Tell us about your security interests..."
                  />
                </div>
              ) : userToShow.bio ? (
                <p className="text-sm text-gray-400 leading-relaxed">{userToShow.bio}</p>
              ) : (
                <p className="text-sm text-gray-600 italic">
                  {isViewingSelf ? 'No bio added yet. Click Edit Profile to add one.' : 'No bio added yet.'}
                </p>
              )}
            </div>

            <Separator className="my-6 bg-white/5" />

            {/* Academic & Contact Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {isMember ? 'Member Academic Credentials' : 'Contact Details'}
              </h4>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Email */}
                <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
                    <Mail className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Email</p>
                    <p className="text-sm text-white truncate max-w-[200px]">{userToShow.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Phone className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Phone</p>
                    {editing ? (
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        className="border-white/10 bg-white/5 text-white text-xs h-7 mt-0.5"
                        placeholder="01XXXXXXXXX"
                      />
                    ) : (
                      <p className="text-sm text-white">{userToShow.phone || '—'}</p>
                    )}
                  </div>
                </div>

                {/* Joined Date */}
                <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-500/10">
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Joined</p>
                    <p className="text-sm text-white">
                      {new Date(userToShow.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Member-specific Academic Fields */}
                {isMember && (
                  <>
                    {/* Student ID / Reg No */}
                    <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Hash className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Registration / Student ID</p>
                        {editing ? (
                          <Input
                            value={form.studentId}
                            onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
                            className="border-white/10 bg-white/5 text-white text-xs h-7 mt-0.5"
                            placeholder="Student ID"
                          />
                        ) : (
                          <p className="text-sm text-white font-mono">{userToShow.studentId || '—'}</p>
                        )}
                      </div>
                    </div>

                    {/* Roll Number */}
                    <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
                        <UserCheck className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Roll Number</p>
                        {editing ? (
                          <Input
                            value={form.rollNumber}
                            onChange={(e) => setForm((p) => ({ ...p, rollNumber: e.target.value }))}
                            className="border-white/10 bg-white/5 text-white text-xs h-7 mt-0.5"
                            placeholder="Roll No"
                          />
                        ) : (
                          <p className="text-sm text-white font-mono">{userToShow.rollNumber || '—'}</p>
                        )}
                      </div>
                    </div>

                    {/* Batch */}
                    <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Layers className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Batch</p>
                        {editing ? (
                          <Input
                            value={form.batch}
                            onChange={(e) => setForm((p) => ({ ...p, batch: e.target.value }))}
                            className="border-white/10 bg-white/5 text-white text-xs h-7 mt-0.5"
                            placeholder="e.g. 62nd"
                          />
                        ) : (
                          <p className="text-sm text-white font-mono">{userToShow.batch || '—'}</p>
                        )}
                      </div>
                    </div>

                    {/* Department */}
                    <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5 sm:col-span-2 lg:col-span-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                        <Building2 className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Department</p>
                        {editing ? (
                          <Input
                            value={form.department}
                            onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                            className="border-white/10 bg-white/5 text-white text-xs h-7 mt-0.5"
                            placeholder="e.g. Computer Science and Engineering (CSE)"
                          />
                        ) : (
                          <p className="text-sm text-white">
                            {userToShow.department ? `${userToShow.department} (${formatDeptShort(userToShow.department)})` : '—'}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Guest Call to Action */}
            {!isMember && isViewingSelf && (
              <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm">Become a Verified Club Member</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Unlock official Member ID Card, exclusive event seats, and certified workshops.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setCurrentView('apply-membership')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shrink-0"
                >
                  Apply for Membership
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 3D Digital Member ID Card Badge Section (For Verified Members) */}
      {isMember && (
        <motion.div variants={item} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                Digital Member ID Card
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                Official club operative badge. Click badge to flip & view oath.
              </p>
            </div>
          </div>

          <DigitalIdCard user={userToShow} />
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur group hover:border-emerald-500/20 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statsLoading ? '—' : stats.eventsAttended}</p>
              <p className="text-xs text-gray-400">Events Attended</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#111]/60 backdrop-blur group hover:border-cyan-500/20 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statsLoading ? '—' : stats.certificates}</p>
              <p className="text-xs text-gray-400">Certificates Earned</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#111]/60 backdrop-blur group hover:border-amber-500/20 transition-colors">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statsLoading ? '—' : stats.payments}</p>
              <p className="text-xs text-gray-400">Payment Transactions</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
