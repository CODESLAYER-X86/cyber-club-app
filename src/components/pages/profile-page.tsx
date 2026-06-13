'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Hash, Building2, Phone, Edit3, Save, Calendar,
  Award, CreditCard, Shield, Clock, Camera, Activity, Lock,
  CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { ROLE_LABELS, MEMBERSHIP_STATUS_LABELS, User } from '@/types';
import { MembershipBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

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
  const [form, setForm] = useState({ name: '', phone: '', bio: '' });
  const [stats, setStats] = useState<ProfileStats>({ eventsAttended: 0, certificates: 0, payments: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [twoFactor, setTwoFactor] = useState(false);

  const isViewingSelf = !selectedMemberId || selectedMemberId === currentUser?.id;
  const userToShow = isViewingSelf ? currentUser : profileUser;

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
    const defaultUser = isViewingSelf ? currentUser : profileUser;
    if (defaultUser) {
      setForm({
        name: defaultUser.name || '',
        phone: defaultUser.phone || '',
        bio: defaultUser.bio || '',
      });
    }
    setEditing(false);
  };

  if (profileLoading && !userToShow) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-400" />
        <p className="mt-2 text-sm text-gray-500">Loading member details...</p>
      </div>
    );
  }

  if (!currentUser) return <div className="py-16 text-center text-gray-500">Please sign in</div>;
  if (!userToShow) return <div className="py-16 text-center text-gray-500">Member not found</div>;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{isViewingSelf ? 'Profile' : 'Member Profile'}</h1>
          <p className="text-sm text-gray-500">{isViewingSelf ? 'Manage your account settings' : 'View member information and activity'}</p>
        </div>
        <div className="flex gap-2">
          {!isViewingSelf && (
            <Button
              onClick={() => {
                setSelectedMemberId(null);
                setCurrentView('members');
              }}
              variant="outline"
              className="border-white/10 text-gray-400 hover:text-white"
            >
              Back to directory
            </Button>
          )}
          {isViewingSelf && (
            <>
              {editing && (
                <Button onClick={handleCancelEdit} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  Cancel
                </Button>
              )}
              <Button
                onClick={editing ? handleSave : () => setEditing(true)}
                disabled={saving}
                variant={editing ? 'default' : 'outline'}
                className={editing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'}
              >
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : editing ? (
                  <><Save className="mr-2 h-4 w-4" />Save Changes</>
                ) : (
                  <><Edit3 className="mr-2 h-4 w-4" />Edit Profile</>
                )}
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={item}>
        <Card className="overflow-hidden border-white/5 bg-[#111]/60 backdrop-blur">
          {/* Gradient banner */}
          <div className="h-28 bg-gradient-to-r from-emerald-600/30 via-cyan-600/20 to-emerald-600/10 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
          </div>

          <CardContent className="relative pt-0 pb-6">
            {/* Avatar */}
            <div className="flex items-end gap-6 -mt-14">
              <div className="relative group">
                {/* Gradient ring */}
                <div className="rounded-full p-[3px] bg-gradient-to-br from-emerald-400 via-cyan-400 to-emerald-500">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#111] text-emerald-400 text-4xl font-bold border-2 border-[#111]">
                    {userToShow.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                </div>
                {/* Status dot */}
                <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-[3px] border-[#111]">
                  <div className="h-full w-full rounded-full bg-emerald-500 animate-pulse" />
                </div>
                {/* Change avatar button */}
                {isViewingSelf && !editing && (
                  <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-3 flex-wrap">
                  {editing ? (
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      className="border-white/10 bg-white/5 text-white text-xl font-bold max-w-xs"
                      placeholder="Your name"
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

            {/* Bio */}
            <div className="mt-6">
              {editing ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Bio</label>
                  <Textarea
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    className="border-white/10 bg-white/5 text-white min-h-[80px] resize-none"
                    placeholder="Tell us about yourself..."
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

            {/* Contact info grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Mail className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Email</p>
                  <p className="text-sm text-white">{userToShow.email}</p>
                </div>
              </div>
              {userToShow.studentId && (
                <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Hash className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Student ID</p>
                    <p className="text-sm text-white">{userToShow.studentId}</p>
                  </div>
                </div>
              )}
              {userToShow.department && (
                <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                    <Building2 className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Department</p>
                    <p className="text-sm text-white">{userToShow.department}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                  <Phone className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Phone</p>
                  {editing ? (
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      className="border-white/10 bg-white/5 text-white text-sm h-7 w-40"
                      placeholder="Phone number"
                    />
                  ) : (
                    <p className="text-sm text-white">{userToShow.phone || 'Not set'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10">
                  <Calendar className="h-4 w-4 text-rose-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Joined</p>
                  <p className="text-sm text-white">{new Date(userToShow.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur group hover:border-emerald-500/20 transition-colors">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
              <Calendar className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              {statsLoading ? (
                <div className="h-7 w-10 animate-pulse rounded bg-white/5" />
              ) : (
                <p className="text-2xl font-bold text-white">{stats.eventsAttended}</p>
              )}
              <p className="text-xs text-gray-500">Events Attended</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur group hover:border-cyan-500/20 transition-colors">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20">
              <Award className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              {statsLoading ? (
                <div className="h-7 w-10 animate-pulse rounded bg-white/5" />
              ) : (
                <p className="text-2xl font-bold text-white">{stats.certificates}</p>
              )}
              <p className="text-xs text-gray-500">Certificates</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur group hover:border-amber-500/20 transition-colors">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
              <CreditCard className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              {statsLoading ? (
                <div className="h-7 w-10 animate-pulse rounded bg-white/5" />
              ) : (
                <p className="text-2xl font-bold text-white">{stats.payments}</p>
              )}
              <p className="text-xs text-gray-500">Payments</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Timeline & Security */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Timeline */}
        <motion.div variants={item}>
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white text-base">
                <Activity className="h-4 w-4 text-emerald-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-8">No recent activity</p>
              ) : (
                <div className="space-y-0">
                  {recentActivity.map((activity, idx) => (
                    <div key={activity.id} className="relative flex gap-3 pb-4 last:pb-0">
                      {/* Timeline line */}
                      {idx < recentActivity.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gradient-to-b from-emerald-500/30 to-transparent" />
                      )}
                      {/* Timeline dot */}
                      <div className="mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{activity.action}</p>
                        <p className="text-xs text-gray-500 truncate">{activity.details}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Card */}
        <motion.div variants={item}>
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white text-base">
                <Shield className="h-4 w-4 text-cyan-400" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Account status */}
              <div className="flex items-center justify-between rounded-lg p-3 bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Account Status</p>
                    <p className="text-xs text-gray-500">{isViewingSelf ? 'Your account is active' : 'This account is active'}</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]">
                  Active
                </Badge>
              </div>

              {/* Last login */}
              <div className="flex items-center justify-between rounded-lg p-3 bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
                    <Clock className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Last Login</p>
                    <p className="text-xs text-gray-500">{new Date(userToShow.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Two-factor auth */}
              {isViewingSelf && (
                <div className="flex items-center justify-between rounded-lg p-3 bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                      <Lock className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Two-Factor Auth</p>
                      <p className="text-xs text-gray-500">{twoFactor ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>
                  <Switch
                    checked={twoFactor}
                    onCheckedChange={setTwoFactor}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
              )}

              {/* Password */}
              {isViewingSelf && (
                <div className="flex items-center justify-between rounded-lg p-3 bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                      <Shield className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Password</p>
                      <p className="text-xs text-gray-500">Last changed recently</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-white h-7">
                    Change
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
