'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Hash, Building2, Phone, Edit3, Save, Calendar,
  Award, CreditCard, Clock, Camera, Activity,
  XCircle, Loader2, ShieldCheck, UserCheck, Layers, BookOpen,
  ArrowRight, ArrowLeft, ExternalLink, Download, Copy, CheckCircle, Eye, Share2, MapPin, Tag, Star
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import {
  ROLE_LABELS,
  MEMBERSHIP_STATUS_LABELS,
  EVENT_CATEGORY_LABELS,
  EVENT_TYPE_LABELS,
  CERTIFICATE_TYPE_LABELS,
  User,
  Certificate,
  CertificateType,
  EventType,
} from '@/types';
import {
  MembershipBadge,
  RegistrationBadge,
  CertificateStatusBadge,
  CertificateTypeBadge,
  EventBadge,
  PaymentBadge,
} from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { DigitalIdCard } from '@/components/shared/digital-id-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatDeptShort } from '@/utils/export-attendees-pdf';
import { jsPDF } from 'jspdf';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  sanitizePhone,
  isValidPhone,
  sanitizeStudentId,
  sanitizeRollNumber,
  sanitizeBatch,
  sanitizeText,
} from '@/lib/input-hardening';

interface ProfileStats {
  eventsAttended: number;
  certificates: number;
  payments: number;
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
  const {
    currentUser,
    selectedMemberId,
    setSelectedMemberId,
    setCurrentView,
    setSelectedEventId,
    updateCurrentUser,
  } = useAppStore();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'certificates' | 'payments'>('events');

  // Certificate modal and download states
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);
  const [copiedCertCode, setCopiedCertCode] = useState<string | null>(null);

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

  const isViewingSelf = !selectedMemberId || selectedMemberId === currentUser?.id;
  const userToShow = profileUser || (isViewingSelf ? currentUser : null);
  const isMember = userToShow?.membershipStatus === 'ACTIVE' || ['PLATFORM_ADMIN', 'PRESIDENT', 'SECRETARY', 'TREASURER', 'EXECUTIVE_MEMBER'].includes(userToShow?.role || '');
  // Leadership permission to inspect other members' records: President, VP, GS, Platform Admin (Treasurer explicitly cannot have this feature)
  const canInspectOtherRecords = !!currentUser && ['PLATFORM_ADMIN', 'PRESIDENT', 'VP', 'GS'].includes(currentUser.role) && currentUser.role !== 'TREASURER';
  const canViewRecords = isViewingSelf || canInspectOtherRecords;
  const canViewFinances = isViewingSelf || canInspectOtherRecords;

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
        setProfileUser(user);
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
  }, [selectedMemberId, currentUser?.id]);

  useEffect(() => {
    fetchProfileUser();
  }, [fetchProfileUser]);

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
        setProfileUser((prev) => (prev ? { ...prev, ...data.data.user } : data.data.user));
        setEditing(false);
        toast({ title: 'Profile Updated', description: 'Your personal information has been saved.' });
      }
    } catch (e) {
      console.error('Failed to save profile', e);
      toast({ title: 'Update Failed', description: 'Could not update profile information.', variant: 'destructive' });
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

  // Certificate Download PDF Handler
  const handleDownloadCertificate = async (cert: Certificate) => {
    setDownloadingCertId(cert.id);
    try {
      const res = await fetch(`/api/certificates/${cert.certificateCode}/og`);
      if (!res.ok) throw new Error('Failed to generate certificate');
      const svgText = await res.text();

      let layout: any = {};
      if (cert.event?.certificateLayout) {
        try {
          layout = JSON.parse(cert.event.certificateLayout);
        } catch {}
      }
      const isLandscape = (layout.orientation || 'LANDSCAPE') === 'LANDSCAPE';
      const width = isLandscape ? 1200 : 840;
      const height = isLandscape ? 840 : 1200;

      const img = new Image();
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * 1.5;
        canvas.height = height * 1.5;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(1.5, 1.5);
          ctx.drawImage(img, 0, 0, width, height);
          const imgData = canvas.toDataURL('image/jpeg', 0.8);

          const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'px',
            format: isLandscape ? [width, height] : [width, height],
            compress: true,
          });

          pdf.addImage(imgData, 'JPEG', 0, 0, width, height, undefined, 'FAST');
          pdf.save(`certificate-${cert.certificateCode}.pdf`);
          toast({ title: 'Certificate downloaded', description: 'Your certificate PDF has been generated and saved.' });
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (e) {
      console.error(e);
      toast({ title: 'Download failed', description: 'Could not download certificate.', variant: 'destructive' });
    } finally {
      setDownloadingCertId(null);
    }
  };

  const handleCopyLink = async (code: string) => {
    const url = `${window.location.origin}/verify/${code}`;
    await navigator.clipboard.writeText(url);
    setCopiedCertCode(code);
    toast({ title: 'Link copied', description: 'Verification link copied to clipboard.' });
    setTimeout(() => setCopiedCertCode(null), 2000);
  };

  if (profileLoading && !userToShow) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-gray-500 font-mono">Loading operative record...</p>
        </div>
      </div>
    );
  }

  if (!userToShow) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-gray-400">User record not found</p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedMemberId(null);
              setCurrentView('members');
            }}
          >
            Back to Members
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
      {/* Top Header with Back Button and Context */}
      <div className="space-y-3">
        {!isViewingSelf && (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedMemberId(null);
                setCurrentView('members');
              }}
              className="text-gray-400 hover:text-white -ml-2 text-xs font-mono"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Members Roster
            </Button>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs">
              Viewing as {ROLE_LABELS[currentUser?.role || ''] || currentUser?.role}
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              {isViewingSelf ? 'My Profile & Credentials' : `${userToShow.name}'s Operative Dossier`}
            </h1>
            <p className="text-sm text-gray-400 font-mono mt-0.5">
              {isMember ? 'Verified Club Operative Record' : 'Guest Account Record'}
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
                  {userToShow.avatar ? (
                    <img
                      src={userToShow.avatar}
                      alt={userToShow.name}
                      className="h-24 w-24 rounded-full object-cover border-2 border-[#111]"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#111] text-emerald-400 text-4xl font-bold border-2 border-[#111]">
                      {userToShow.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
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
                    placeholder="Tell us about security interests..."
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
                        onChange={(e) => setForm((p) => ({ ...p, phone: sanitizePhone(e.target.value) }))}
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
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Joined Club</p>
                    <p className="text-sm text-white">
                      {new Date(userToShow.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Member Academic Credentials */}
                {isMember && (
                  <>
                    <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Hash className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Student / Reg ID</p>
                        {editing ? (
                          <Input
                            value={form.studentId}
                            onChange={(e) => setForm((p) => ({ ...p, studentId: sanitizeStudentId(e.target.value) }))}
                            className="border-white/10 bg-white/5 text-white text-xs h-7 mt-0.5"
                            placeholder="Student ID"
                          />
                        ) : (
                          <p className="text-sm text-white font-mono">{userToShow.studentId || '—'}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
                        <UserCheck className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Roll Number</p>
                        {editing ? (
                          <Input
                            value={form.rollNumber}
                            onChange={(e) => setForm((p) => ({ ...p, rollNumber: sanitizeRollNumber(e.target.value) }))}
                            className="border-white/10 bg-white/5 text-white text-xs h-7 mt-0.5"
                            placeholder="Roll No"
                          />
                        ) : (
                          <p className="text-sm text-white font-mono">{userToShow.rollNumber || '—'}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg p-3 bg-white/[0.02] border border-white/5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Layers className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Batch</p>
                        {editing ? (
                          <Input
                            value={form.batch}
                            onChange={(e) => setForm((p) => ({ ...p, batch: sanitizeBatch(e.target.value) }))}
                            className="border-white/10 bg-white/5 text-white text-xs h-7 mt-0.5"
                            placeholder="e.g. 62nd"
                          />
                        ) : (
                          <p className="text-sm text-white font-mono">{userToShow.batch || '—'}</p>
                        )}
                      </div>
                    </div>

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
                    Unlock official Member ID Card, exclusive member-only workshops, and certificates.
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

      {/* 3D Digital Member ID Card Badge Section */}
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

      {/* Top Quick Stats & Detail Tabs Section (Visible to Self or President/Leadership) */}
      {canViewRecords && (
        <>
          {/* Top Quick Stats Summary Cards */}
          <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        <Card
          onClick={() => setActiveTab('events')}
          className={cn(
            'cursor-pointer border-white/5 bg-[#111]/60 backdrop-blur transition-all duration-300 hover:border-emerald-500/30',
            activeTab === 'events' ? 'border-emerald-500/40 bg-emerald-500/5 shadow-lg shadow-emerald-500/5' : ''
          )}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statsLoading ? '—' : stats.eventsAttended}</p>
              <p className="text-xs text-gray-400">Events Joined</p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('certificates')}
          className={cn(
            'cursor-pointer border-white/5 bg-[#111]/60 backdrop-blur transition-all duration-300 hover:border-cyan-500/30',
            activeTab === 'certificates' ? 'border-cyan-500/40 bg-cyan-500/5 shadow-lg shadow-cyan-500/5' : ''
          )}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statsLoading ? '—' : stats.certificates}</p>
              <p className="text-xs text-gray-400">Certificates Earned</p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => canViewFinances && setActiveTab('payments')}
          className={cn(
            'border-white/5 bg-[#111]/60 backdrop-blur transition-all duration-300',
            canViewFinances ? 'cursor-pointer hover:border-amber-500/30' : 'opacity-70 cursor-default',
            activeTab === 'payments' ? 'border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-500/5' : ''
          )}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{statsLoading ? '—' : stats.payments}</p>
              <p className="text-xs text-gray-400">Payment Records</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Interactive Tabs Section */}
      <motion.div variants={item} className="space-y-6">
        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('events')}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-mono transition-all',
                activeTab === 'events'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              Events Joined
              <span className="ml-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                {userToShow.eventRegistrations?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('certificates')}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-mono transition-all',
                activeTab === 'certificates'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              )}
            >
              <Award className="h-3.5 w-3.5" />
              Certificates Earned
              <span className="ml-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400">
                {userToShow.certificates?.length || 0}
              </span>
            </button>

            {canViewFinances && (
              <button
                onClick={() => setActiveTab('payments')}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-mono transition-all',
                  activeTab === 'payments'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                )}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Payments & Dues
                <span className="ml-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  {userToShow.payments?.length || 0}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: EVENTS JOINED */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {(!userToShow.eventRegistrations || userToShow.eventRegistrations.length === 0) ? (
              <div className="rounded-xl border border-white/5 bg-[#111]/40 p-12 text-center">
                <Calendar className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">No event registrations recorded</p>
                <p className="text-gray-600 text-xs mt-1">This user has not registered for any events yet.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {userToShow.eventRegistrations.map((reg) => {
                  const event = reg.event;
                  if (!event) return null;
                  const userAttendance = userToShow.attendance?.find((a) => a.eventId === reg.eventId);
                  const isPresent = userAttendance?.status === 'PRESENT';

                  return (
                    <Card
                      key={reg.id}
                      className="border-white/5 bg-[#111]/60 backdrop-blur hover:border-emerald-500/30 transition-all overflow-hidden"
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">
                                {EVENT_CATEGORY_LABELS[event.category] || event.category}
                              </Badge>
                              <Badge variant="outline" className="border-white/10 text-gray-400 text-[10px]">
                                {EVENT_TYPE_LABELS[event.type as EventType] || (event.type === 'MEMBER_ONLY' ? 'Member Only' : 'Public')}
                              </Badge>
                              <RegistrationBadge status={reg.status} />
                              {isPresent ? (
                                <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                                  <CheckCircle className="mr-1 h-3 w-3" /> Attended (Present)
                                </Badge>
                              ) : userAttendance?.status === 'ABSENT' ? (
                                <Badge className="border-red-500/30 bg-red-500/10 text-red-400 text-[10px]">
                                  Absent
                                </Badge>
                              ) : null}
                              {event.fee > 0 ? (
                                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                                  Paid (৳{event.fee})
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-white/10 text-gray-400 text-[10px]">
                                  Free
                                </Badge>
                              )}
                            </div>

                            <h3 className="text-base font-bold text-white truncate">{event.title}</h3>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                                {new Date(event.startDate).toLocaleDateString()}
                              </span>
                              {event.venue && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                                  {event.venue}
                                </span>
                              )}
                              <span className="text-[11px] text-gray-600 font-mono">
                                Registered: {new Date(reg.registeredAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEventId(event.id);
                                setCurrentView('event-detail');
                              }}
                              className="border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10 hover:text-white text-xs font-mono h-8"
                            >
                              View Event
                              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CERTIFICATES EARNED */}
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            {(!userToShow.certificates || userToShow.certificates.length === 0) ? (
              <div className="rounded-xl border border-white/5 bg-[#111]/40 p-12 text-center">
                <Award className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">No certificates earned yet</p>
                <p className="text-gray-600 text-xs mt-1">This user has not been issued any event certificates.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {userToShow.certificates.map((cert) => {
                  const isExcellence = cert.type === 'EXCELLENCE';
                  const canPreview = ['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(cert.status);

                  return (
                    <Card
                      key={cert.id}
                      className={cn(
                        'relative border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 via-[#111] to-cyan-500/5 backdrop-blur transition-all duration-300 overflow-hidden hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5'
                      )}
                    >
                      {/* Excellence ribbon */}
                      {isExcellence && (
                        <div className="absolute -right-8 top-4 rotate-45 bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-lg">
                          Excellence
                        </div>
                      )}

                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div
                            className={cn(
                              'flex h-11 w-11 items-center justify-center rounded-xl border',
                              isExcellence
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            )}
                          >
                            {isExcellence ? <Star className="h-5 w-5" /> : <Award className="h-5 w-5" />}
                          </div>
                          <CertificateStatusBadge status={cert.status} />
                        </div>

                        <div>
                          <h3 className="font-bold text-white text-base line-clamp-1">
                            {cert.event?.title || 'Cyber Security Club Certification'}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                              {CERTIFICATE_TYPE_LABELS[cert.type]}
                            </Badge>
                            {cert.score !== null && cert.score !== undefined && (
                              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">
                                Score: {cert.score}%
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Certificate Code & Date */}
                        <div className="rounded-lg bg-black/40 border border-white/5 p-2.5 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Credential ID</p>
                            <p className="font-mono text-xs text-emerald-400 font-semibold select-all">
                              {cert.certificateCode}
                            </p>
                          </div>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {new Date(cert.issuedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Authority details */}
                        {(cert.issuer || cert.approver) && (
                          <div className="text-[11px] text-gray-500 space-y-0.5 border-t border-white/5 pt-2">
                            {cert.issuer && (
                              <p>
                                <span className="text-gray-600">Issued by:</span>{' '}
                                <span className="text-gray-300 font-medium">{cert.issuer.name}</span>
                              </p>
                            )}
                            {cert.approver && (
                              <p>
                                <span className="text-gray-600">Approved by:</span>{' '}
                                <span className="text-cyan-400/80 font-medium">{cert.approver.name}</span>
                              </p>
                            )}
                          </div>
                        )}

                        {/* Action Buttons: Preview, Verify, Download */}
                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-white/5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewCert(cert)}
                            className="h-8 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-mono"
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Preview
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 font-mono"
                          >
                            <a
                              href={`/verify/${cert.certificateCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                              Verify
                            </a>
                          </Button>

                          {canPreview && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={downloadingCertId === cert.id}
                              onClick={() => handleDownloadCertificate(cert)}
                              className="h-8 text-xs text-gray-400 hover:text-white hover:bg-white/5 font-mono"
                            >
                              {downloadingCertId === cert.id ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Download
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PAYMENTS & TREASURY */}
        {activeTab === 'payments' && canViewFinances && (
          <div className="space-y-4">
            {(!userToShow.payments || userToShow.payments.length === 0) ? (
              <div className="rounded-xl border border-white/5 bg-[#111]/40 p-12 text-center">
                <CreditCard className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">No payment transactions recorded</p>
                <p className="text-gray-600 text-xs mt-1">This user has no verified or pending treasury payments.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {userToShow.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/5 bg-[#111]/60 backdrop-blur"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{p.paymentMethod}</span>
                        <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          TxID: {p.transactionId}
                        </span>
                        <Badge variant="outline" className="text-[10px] border-white/10 text-gray-400">
                          {p.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">
                        {new Date(p.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <span className="text-base font-bold font-mono text-white">
                        ৳{p.amount.toLocaleString()}
                      </span>
                      <PaymentBadge status={p.status as any} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  )}

      {/* Certificate Visual Preview Modal */}
      <Dialog open={!!previewCert} onOpenChange={(open) => { if (!open) setPreviewCert(null); }}>
        <DialogContent className="border-white/10 bg-[#0d131f] text-white max-w-4xl p-6 overflow-hidden">
          <DialogHeader>
            <div className="flex items-start justify-between pr-6 gap-4">
              <div>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-400" />
                  {previewCert?.event?.title || 'Official Certificate of Recognition'}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-400 font-mono mt-1">
                  Credential ID: <span className="text-emerald-400 font-semibold">{previewCert?.certificateCode}</span>
                </DialogDescription>
              </div>
              {previewCert && (
                <div className="flex items-center gap-2 shrink-0">
                  <CertificateStatusBadge status={previewCert.status} />
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                    {CERTIFICATE_TYPE_LABELS[previewCert.type]}
                  </Badge>
                </div>
              )}
            </div>
          </DialogHeader>

          {previewCert && (
            <div className="space-y-4 my-2">
              {/* Live Rendered SVG Certificate Image */}
              <div className="relative rounded-xl border border-white/10 bg-black/60 overflow-hidden shadow-2xl p-2 flex items-center justify-center">
                <img
                  src={`/api/certificates/${previewCert.certificateCode}/og`}
                  alt="Official Certificate Preview"
                  className="w-full h-auto rounded-lg object-contain max-h-[58vh]"
                />
              </div>

              {/* Certificate metadata strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-mono">Recipient</span>
                  <span className="text-white font-medium truncate block">{userToShow.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-mono">Issue Date</span>
                  <span className="text-white font-medium block">
                    {new Date(previewCert.issuedAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-mono">Issued By</span>
                  <span className="text-cyan-400 font-medium truncate block">
                    {previewCert.issuer?.name || 'General Secretary'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-mono">Authorized By</span>
                  <span className="text-amber-400 font-medium truncate block">
                    {previewCert.approver?.name || 'President'}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(previewCert.certificateCode)}
                  className="border-white/10 text-gray-300 hover:text-white text-xs font-mono"
                >
                  {copiedCertCode === previewCert.certificateCode ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy Verification Link
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs font-mono"
                  >
                    <a
                      href={`/verify/${previewCert.certificateCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Open Public Verification
                    </a>
                  </Button>

                  <Button
                    size="sm"
                    disabled={downloadingCertId === previewCert.id}
                    onClick={() => handleDownloadCertificate(previewCert)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono"
                  >
                    {downloadingCertId === previewCert.id ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
