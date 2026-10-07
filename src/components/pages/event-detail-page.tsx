'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, Award, CheckCircle, AlertTriangle, Share2, Pencil, Loader2, User, ChevronDown, ChevronUp, ShieldCheck, Eye, Trash2, XCircle, Flag, FileDown, Copy, Check, CreditCard, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/use-app-store';
import type { Event, EventRegistration, User as UserType, EventType } from '@/types';
import { EVENT_TYPE_LABELS, EVENT_CATEGORY_LABELS, ROLE_LABELS, CERTIFICATE_TYPE_LABELS, CertificateType } from '@/types';
import { EventBadge, RegistrationBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { exportEventAttendeesPdf } from '@/utils/export-attendees-pdf';

type EventDetailData = Omit<Event, 'registrations'> & {
  creator?: Pick<UserType, 'id' | 'name' | 'email' | 'avatar' | 'role'>;
  verifier?: Pick<UserType, 'id' | 'name' | 'email' | 'avatar' | 'role'>;
  registrations?: (EventRegistration & {
    user?: Pick<UserType, 'id' | 'name' | 'email' | 'avatar' | 'role' | 'membershipStatus' | 'studentId' | 'rollNumber' | 'batch' | 'department' | 'phone'>;
  })[];
  _count?: { registrations: number };
};
const parsePaymentConfig = (paymentConfig?: string | null) => {
  if (!paymentConfig) return null;
  try {
    return JSON.parse(paymentConfig);
  } catch {
    return null;
  }
};
export function EventDetailPage() {
  const { currentUser, selectedEventId, setCurrentView, setSelectedEventId, setSelectedMemberId, setEditingEventId, setEditingEventData } = useAppStore();
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BKASH');
  const [sentToNumber, setSentToNumber] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userRegistration, setUserRegistration] = useState<EventRegistration | null>(null);
  const [showRegistrants, setShowRegistrants] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingCertUserId, setUpdatingCertUserId] = useState<string | null>(null);
  const [updatingRegId, setUpdatingRegId] = useState<string | null>(null);

  // Enhanced certificate states
  const [prefName, setPrefName] = useState('');
  const [studId, setStudId] = useState('');
  const [dept, setDept] = useState('');
  const [inst, setInst] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [certificateStatus, setCertificateStatus] = useState<string>('REGISTERED');
  const [updatingAttendanceId, setUpdatingAttendanceId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyPaymentNumber = (number: string, label: string, key: string) => {
    if (!number) return;
    navigator.clipboard.writeText(number);
    setCopiedKey(key);
    setSentToNumber(number);

    if (key === 'bkashNumber') setPaymentMethod('BKASH');
    else if (key === 'nagadNumber') setPaymentMethod('NAGAD');
    else if (key === 'rocketNumber') setPaymentMethod('ROCKET');
    else if (key === 'bankAccount') setPaymentMethod('BANK');

    toast({
      title: `${label} Number Copied`,
      description: `${number} copied to clipboard & auto-filled in recipient number.`,
    });

    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const loadEvent = useCallback(async (showSkeleton = true) => {
    let eventId = selectedEventId;
    if (!eventId && typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        eventId = urlParams.get('id') || urlParams.get('eventId') || urlParams.get('event') || localStorage.getItem('csc_selected_event_id');
        if (eventId) {
          setSelectedEventId(eventId);
        }
      } catch {}
    }

    if (!eventId) {
      if (showSkeleton) setLoading(false);
      return;
    }

    if (showSkeleton) setLoading(true);
    try {
      // Parallel fetch: event data + certificate status (if logged in)
      const eventPromise = fetch(`/api/events/${eventId}`).then(r => r.json());
      const certPromise = currentUser
        ? fetch(`/api/certificates?userId=${currentUser.id}`).then(r => r.json()).catch(() => null)
        : Promise.resolve(null);

      const [data, certData] = await Promise.all([eventPromise, certPromise]);

      if (data.success) {
        setEvent(data.data.event);
        // Check if current user is already registered
        if (currentUser && data.data.event.registrations) {
          const reg = data.data.event.registrations.find(
            (r: EventRegistration) => r.userId === currentUser.id
          );
          setUserRegistration(reg || null);
        }
      }

      // Process certificate status from parallel fetch
      if (certData?.success && certData.data.certificates) {
        const userCert = certData.data.certificates.find((c: any) => c.eventId === eventId);
        if (userCert) {
          setCertificateStatus(userCert.status);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, [selectedEventId, currentUser, setSelectedEventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Sync preferred name fields when registration loads
  useEffect(() => {
    if (userRegistration) {
      setPrefName(userRegistration.preferredName || '');
      setStudId(userRegistration.studentId || currentUser?.studentId || '');
      setDept(userRegistration.department || currentUser?.department || '');
      setInst(userRegistration.institution || '');
    }
  }, [userRegistration, currentUser]);

  const handleSaveName = async () => {
    if (!event || !currentUser) return;
    setSavingName(true);
    try {
      const res = await fetch(`/api/events/${event.id}/preferred-name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          preferredName: prefName.trim(),
          studentId: studId.trim(),
          department: dept.trim(),
          institution: inst.trim(),
        }),
      });
      const d = await res.json();
      if (d.success) {
        toast({ title: 'Updated', description: 'Your certificate information has been saved.' });
        loadEvent(false);
      } else {
        toast({ title: 'Error', description: d.error || 'Failed to update', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setSavingName(false);
    }
  };

  const handleMarkAttendance = async (userId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (!event || !currentUser) return;
    setUpdatingAttendanceId(userId);

    // Optimistic in-place update in local state for 0ms instant UI response
    setEvent((prev: any) => {
      if (!prev) return prev;
      const currentAttendance = Array.isArray(prev.attendance) ? [...prev.attendance] : [];
      const idx = currentAttendance.findIndex((a: any) => a.userId === userId);
      if (idx >= 0) {
        currentAttendance[idx] = { ...currentAttendance[idx], status };
      } else {
        currentAttendance.push({ userId, status, eventId: prev.id, id: 'temp-' + Date.now() });
      }
      return { ...prev, attendance: currentAttendance };
    });

    try {
      const r = await fetch(`/api/events/${event.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          status,
          verifierRole: currentUser.role,
          verifierId: currentUser.id,
        }),
      });
      const d = await r.json();
      if (d.success) {
        toast({ title: 'Attendance Marked', description: `Attendance marked as ${status.toLowerCase()}.` });
        loadEvent(false);
      } else {
        toast({ title: 'Error', description: d.error || 'Failed to update attendance', variant: 'destructive' });
        loadEvent(false);
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
      loadEvent(false);
    } finally {
      setUpdatingAttendanceId(null);
    }
  };

  const handleUpdateCertType = async (userId: string, type: string) => {
    if (!event || !currentUser) return;
    setUpdatingCertUserId(userId);
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          eventId: event.id,
          type,
        }),
      });
      const d = await res.json();
      if (d.success) {
        toast({ title: 'Certificate Updated', description: `Assigned as ${CERTIFICATE_TYPE_LABELS[type as CertificateType]}.` });
        loadEvent(false);
      } else {
        toast({ title: 'Failed to update', description: d.error || 'Please try again', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Update failed', description: 'Network error', variant: 'destructive' });
    } finally {
      setUpdatingCertUserId(null);
    }
  };

  const handleRegister = async () => {
    if (!event || !currentUser) return;
    setRegistering(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          transactionId: event.fee > 0 ? transactionId : undefined,
          paymentMethod: event.fee > 0 ? paymentMethod : undefined,
          sentToNumber: event.fee > 0 ? (sentToNumber || paymentConfig?.contactPersonPhone || undefined) : undefined,
          receiverName: event.fee > 0 ? (receiverName || paymentConfig?.contactPersonName || undefined) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const reg = data.data.registration;
        const isPaid = event.fee > 0;
        const successMsg = isPaid
          ? 'Successfully registered! Your payment is pending verification. You will be approved once payment is confirmed.'
          : 'Successfully registered! Your registration has been approved.';
        setMessage({ type: 'success', text: successMsg });
        setUserRegistration(reg || { status: isPaid ? 'PENDING' : 'APPROVED' });
        // Reload event data to get updated registrations list and seat count
        loadEvent();
      } else {
        setMessage({ type: 'error', text: data.error || 'Registration failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}?view=event-detail&id=${event?.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('Link copied!');
    } catch {
      setShareMsg('Could not copy link');
    }
    setTimeout(() => setShareMsg(null), 2000);
  };

  const handleEdit = () => {
    if (event) {
      setSelectedEventId(event.id);
      setEditingEventId(event.id);
      // Store event data snapshot so the create form can pre-populate without fetching
      setEditingEventData({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
        venue: event.venue,
        fee: event.fee,
        maxSeats: event.maxSeats ?? null,
        requiresAssessment: event.requiresAssessment,
        passingScore: event.passingScore ?? null,
        paymentConfig: event.paymentConfig ?? null,
      });
    }
    setCurrentView('create-event');
  };

  const handleDeleteEvent = async () => {
    if (!event || !currentUser) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: currentUser.role }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Event deleted', description: `"${event.title}" has been deleted.` });
        setCurrentView('events');
      } else {
        toast({ title: 'Delete failed', description: data.error || 'Could not delete event', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Delete failed', description: 'Something went wrong', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-white/5" />
        <div className="h-64 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }
  if (!event) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-gray-400 text-lg">Event not found or no event selected.</p>
        <Button variant="outline" onClick={() => setCurrentView('events')} className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
        </Button>
      </div>
    );
  }

  const seatPercent = event.maxSeats ? Math.min((event.currentSeats / event.maxSeats) * 100, 100) : 0;
  const isFull = event.maxSeats ? event.currentSeats >= event.maxSeats : false;
  // For MEMBER_ONLY events, without guest, all other roles can apply (or active member status)
  const isEligibleMember = !!currentUser && (currentUser.role !== 'GUEST' || currentUser.membershipStatus === 'ACTIVE');
  const canRegisterForEventType = event.type === 'MEMBER_ONLY' ? isEligibleMember : !!currentUser;
  const canRegister = canRegisterForEventType && !isFull && event.status === 'UPCOMING' && !userRegistration;
  const isAdmin = currentUser && ['PLATFORM_ADMIN', 'PRESIDENT', 'VP', 'GS'].includes(currentUser.role);
  const canApproveReg = currentUser && (
    ['PLATFORM_ADMIN', 'PRESIDENT', 'VP', 'GS', 'VERIFIER'].includes(currentUser.role) ||
    event.verifierId === currentUser.id ||
    event.createdBy === currentUser.id
  );
  const canEdit = currentUser && ['PLATFORM_ADMIN', 'PRESIDENT', 'VP', 'GS', 'MEDIA'].includes(currentUser.role);
  const canDelete = currentUser && ['PLATFORM_ADMIN', 'PRESIDENT'].includes(currentUser.role);
  const registrationCount = event._count?.registrations ?? event.registrations?.length ?? event.currentSeats;
  const paymentConfig = parsePaymentConfig(event.paymentConfig);
  const paymentFee = paymentConfig?.feeAmount ?? event.fee ?? 0;
  const paymentMethods = [
    { key: 'bkashNumber', label: 'bKash', value: paymentConfig?.bkashNumber },
    { key: 'nagadNumber', label: 'Nagad', value: paymentConfig?.nagadNumber },
    { key: 'rocketNumber', label: 'Rocket', value: paymentConfig?.rocketNumber },
    { key: 'bankAccount', label: 'Bank Transfer', value: paymentConfig?.bankAccount },
  ].filter((method) => method.value);

  return (
    <div className="space-y-6">
      {/* Back Button & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <Button variant="ghost" size="sm" onClick={() => setCurrentView('events')} className="text-gray-400 hover:text-white px-2 sm:px-3 text-xs sm:text-sm shrink-0">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Events
        </Button>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Share Button */}
          <div className="relative">
            <Button variant="outline" size="sm" onClick={handleShare} className="border-white/10 bg-white/5 text-gray-300 hover:text-white hover:border-emerald-500/30 text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3">
              <Share2 className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
              <span>Share</span>
            </Button>
            {shareMsg && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -bottom-8 right-0 whitespace-nowrap rounded bg-emerald-600 px-2 py-1 text-xs text-white z-20"
              >
                {shareMsg}
              </motion.div>
            )}
          </div>
          {/* Edit Button */}
          {canEdit && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentView('certificate-designer')} className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-white text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3">
                <Award className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                <span className="hidden sm:inline">Design Certificate</span>
                <span className="sm:hidden">Cert Design</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleEdit} className="border-white/10 bg-white/5 text-gray-300 hover:text-white hover:border-emerald-500/30 text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3">
                <Pencil className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                <span className="hidden sm:inline">Edit Event</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            </div>
          )}
          {/* Delete Button */}
          {canDelete && (
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)} className="border-red-500/20 bg-red-500/5 text-red-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3">
              <Trash2 className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
              <span>Delete</span>
            </Button>
          )}
          {/* Mark as Completed Button */}
          {isAdmin && (event.status === 'UPCOMING' || event.status === 'ONGOING') && (
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                const res = await fetch(`/api/events/${event.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'COMPLETED' }),
                });
                const d = await res.json();
                if (d.success) {
                  toast({ title: 'Event completed', description: 'Event marked as completed. Certificates can now be issued.' });
                  loadEvent();
                } else {
                  toast({ title: 'Failed', description: d.error || 'Could not update event', variant: 'destructive' });
                }
              } catch {
                toast({ title: 'Failed', description: 'Network error', variant: 'destructive' });
              }
            }} className="border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-500/40">
              <Flag className="mr-2 h-4 w-4" /> Mark Completed
            </Button>
          )}
        </div>
      </div>

      {/* Event Detail Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <EventBadge status={event.status} />
              <Badge variant="outline" className="border-white/10 text-gray-400">{EVENT_TYPE_LABELS[event.type as EventType] || (event.type === 'MEMBER_ONLY' ? 'Member Only' : 'Public')}</Badge>
              {event.fee > 0 ? (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">Paid (৳{event.fee})</Badge>
              ) : (
                <Badge variant="outline" className="border-white/10 text-gray-400">Free</Badge>
              )}
              {event.maxSeats && event.maxSeats > 0 && (
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">Limited Seats ({event.maxSeats})</Badge>
              )}
              <Badge variant="outline" className="border-white/10 text-gray-400">{EVENT_CATEGORY_LABELS[event.category]}</Badge>
              {event.requiresAssessment && <Badge variant="outline" className="border-amber-500/30 text-amber-400">Assessment Required</Badge>}
            </div>

            <h1 className="text-3xl font-bold text-white">{event.title}</h1>
            <p className="mt-4 text-gray-400 leading-relaxed">{event.description}</p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Start Date</p>
                    <p className="text-xs text-gray-500">{new Date(event.startDate).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm font-medium text-white">End Date</p>
                    <p className="text-xs text-gray-500">{new Date(event.endDate).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Venue</p>
                    <p className="text-xs text-gray-500">{event.venue}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Fee</p>
                    <p className="text-xs text-gray-500">{event.fee > 0 ? `৳${event.fee}` : 'Free'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Registrations</p>
                    <p className="text-xs text-gray-500">{registrationCount} / {event.maxSeats || 'Unlimited'}</p>
                  </div>
                </div>
                {event.requiresAssessment && (
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Passing Score</p>
                      <p className="text-xs text-gray-500">{event.passingScore}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Organizer & Verifier Info */}
            <Separator className="my-6 bg-white/5" />
            <div className="grid gap-4 sm:grid-cols-2">
              {event.creator && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                    <User className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Organizer</p>
                    <p className="text-sm font-medium text-white">{event.creator.name}</p>
                    <p className="text-xs text-gray-500">{ROLE_LABELS[event.creator.role as keyof typeof ROLE_LABELS] || event.creator.role}</p>
                  </div>
                </div>
              )}
              {event.verifier && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10">
                    <ShieldCheck className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Verifier</p>
                    <p className="text-sm font-medium text-white">{event.verifier.name}</p>
                    <p className="text-xs text-gray-500">{ROLE_LABELS[event.verifier.role as keyof typeof ROLE_LABELS] || event.verifier.role}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Seat Progress */}
            {event.maxSeats && (
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs text-gray-500">
                  <span>{event.currentSeats} registered</span>
                  <span>{event.maxSeats} total</span>
                </div>
                <Progress value={seatPercent} className="h-2 bg-white/5 [&>div]:bg-emerald-500" />
                {isFull && <p className="mt-1 text-xs text-red-400">This event is fully booked</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Registration Status Section (when user has already registered) */}
      {userRegistration && currentUser && (
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-cyan-500/20 bg-cyan-500/5 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                    {userRegistration.status === 'APPROVED' ? (
                      <CheckCircle className="h-6 w-6 text-emerald-400" />
                    ) : userRegistration.status === 'REJECTED' ? (
                      <XCircle className="h-6 w-6 text-red-400" />
                    ) : (
                      <Eye className="h-6 w-6 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Your Registration Status</p>
                    <div className="mt-1 flex items-center gap-2">
                      <RegistrationBadge status={userRegistration.status} />
                      <span className="text-xs text-gray-500">
                        {userRegistration.status === 'APPROVED' && 'You are confirmed for this event!'}
                        {userRegistration.status === 'PENDING' && 'Your registration is awaiting approval.'}
                        {userRegistration.status === 'REJECTED' && 'Your registration was not approved.'}
                        {userRegistration.status === 'CANCELLED' && 'Your registration was cancelled.'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Certificate Name Customization */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-semibold text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-400" />
                  Certificate Customization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(certificateStatus) ? (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
                    <strong>Notice:</strong> Your certificate processing has started or completed. Information is locked.
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    Specify preferred details to print on your certificate. Changes are allowed until the certificate is authorized or generated.
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Preferred Name</label>
                    <Input
                      value={prefName}
                      disabled={['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(certificateStatus) || savingName}
                      onChange={e => setPrefName(e.target.value)}
                      placeholder={currentUser.name}
                      className="border-white/10 bg-white/5 text-white h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Student ID</label>
                    <Input
                      value={studId}
                      disabled={['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(certificateStatus) || savingName}
                      onChange={e => setStudId(e.target.value)}
                      placeholder={currentUser.studentId || "Student ID"}
                      className="border-white/10 bg-white/5 text-white h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Department</label>
                    <Input
                      value={dept}
                      disabled={['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(certificateStatus) || savingName}
                      onChange={e => setDept(e.target.value)}
                      placeholder={currentUser.department || "e.g. CSE"}
                      className="border-white/10 bg-white/5 text-white h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Institution (optional)</label>
                    <Input
                      value={inst}
                      disabled={['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(certificateStatus) || savingName}
                      onChange={e => setInst(e.target.value)}
                      placeholder="e.g. University Name"
                      className="border-white/10 bg-white/5 text-white h-9"
                    />
                  </div>
                </div>

                {!['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(certificateStatus) && (
                  <Button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-4"
                  >
                    {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                    Save Certificate Info
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Registration Section */}
      {currentUser && event.status === 'UPCOMING' && !userRegistration && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg text-white">Registration</CardTitle>
            </CardHeader>
            <CardContent>
              {!canRegisterForEventType ? (
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm">This event is restricted to club members. Guests cannot register.</p>
                </div>
              ) : isFull ? (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm">This event is fully booked.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentFee > 0 && (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                          <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 font-mono">
                            <CreditCard className="h-3.5 w-3.5" /> Official Payment Channels
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            Fee: ৳{paymentFee}
                          </span>
                        </div>

                        {paymentMethods.length > 0 && (
                          <div className="grid gap-2">
                            {paymentMethods.map((method) => {
                              const isBkash = method.key === 'bkashNumber';
                              const isNagad = method.key === 'nagadNumber';
                              const isRocket = method.key === 'rocketNumber';
                              const isCopied = copiedKey === method.key;

                              return (
                                <div
                                  key={method.key}
                                  className={cn(
                                    "flex items-center justify-between gap-2 rounded-lg border p-2.5 sm:px-3 sm:py-2 text-xs transition-all",
                                    isBkash
                                      ? "border-pink-500/30 bg-pink-950/20 hover:border-pink-500/50"
                                      : isNagad
                                      ? "border-orange-500/30 bg-orange-950/20 hover:border-orange-500/50"
                                      : isRocket
                                      ? "border-indigo-500/30 bg-indigo-950/20 hover:border-indigo-500/50"
                                      : "border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-500/50"
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={cn(
                                        "font-semibold font-mono text-[10px] sm:text-[11px] shrink-0 px-1.5 py-0.5 rounded border",
                                        isBkash
                                          ? "text-pink-300 border-pink-500/40 bg-pink-500/15"
                                          : isNagad
                                          ? "text-orange-300 border-orange-500/40 bg-orange-500/15"
                                          : isRocket
                                          ? "text-indigo-300 border-indigo-500/40 bg-indigo-500/15"
                                          : "text-cyan-300 border-cyan-500/40 bg-cyan-500/15"
                                      )}
                                    >
                                      {method.label}
                                    </span>
                                    <span className="font-mono font-bold text-white tracking-wider text-xs sm:text-sm truncate select-all">
                                      {method.value}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyPaymentNumber(method.value!, method.label, method.key)}
                                    className={cn(
                                      "flex items-center gap-1.5 shrink-0 rounded-md px-2.5 py-1 text-[11px] font-mono font-medium transition-all shadow-sm active:scale-95",
                                      isCopied
                                        ? "bg-emerald-500 text-slate-950 font-bold"
                                        : "bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10"
                                    )}
                                    title={`Copy ${method.label} number`}
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="h-3.5 w-3.5" />
                                        <span>Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3.5 w-3.5" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {paymentConfig?.paymentInstructions && (
                          <p className="text-xs text-gray-400 leading-relaxed pt-1">{paymentConfig.paymentInstructions}</p>
                        )}
                        {paymentConfig?.contactPersonName && (
                          <div className="flex items-center justify-between text-xs text-gray-400 pt-1.5 border-t border-white/5">
                            <span className="truncate">
                              Contact: {paymentConfig.contactPersonName}
                              {paymentConfig.contactPersonPhone ? ` • ${paymentConfig.contactPersonPhone}` : ''}
                            </span>
                            {paymentConfig.contactPersonPhone && (
                              <button
                                type="button"
                                onClick={() => handleCopyPaymentNumber(paymentConfig.contactPersonPhone, 'Contact', 'contactPhone')}
                                className={cn(
                                  "flex items-center gap-1 text-[11px] font-mono shrink-0 px-2 py-0.5 rounded transition-all",
                                  copiedKey === 'contactPhone'
                                    ? "text-emerald-400 font-bold bg-emerald-500/10"
                                    : "text-gray-400 hover:text-white bg-white/5"
                                )}
                              >
                                {copiedKey === 'contactPhone' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                <span>{copiedKey === 'contactPhone' ? 'Copied' : 'Copy'}</span>
                              </button>
                            )}
                          </div>
                        )}
                        {paymentConfig?.paymentDeadline && (
                          <p className="text-xs text-amber-300 font-mono">Payment deadline: {new Date(paymentConfig.paymentDeadline).toLocaleString()}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400">Payment Method & Transaction ID</label>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="col-span-1 h-10 px-2 rounded-md border border-white/10 bg-[#111] text-white focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm focus:outline-none"
                          >
                            <option value="BKASH">bKash</option>
                            <option value="NAGAD">Nagad</option>
                            <option value="ROCKET">Rocket</option>
                            <option value="BANK">Bank</option>
                            <option value="CASH">Cash</option>
                          </select>
                          <Input
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="TXN-XXXXXXX"
                            className="col-span-2 border-white/10 bg-white/5 text-white placeholder:text-gray-600"
                          />
                        </div>
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-mono text-gray-400">Recipient / Sent-To Number (Account that received fee)</label>
                            {sentToNumber && (
                              <button
                                type="button"
                                onClick={() => setSentToNumber('')}
                                className="text-[10px] font-mono text-gray-500 hover:text-gray-300"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <Input
                            value={sentToNumber}
                            onChange={(e) => setSentToNumber(e.target.value)}
                            placeholder={paymentConfig?.contactPersonPhone ? `e.g. ${paymentConfig.contactPersonPhone}` : "e.g. 01XXXXXXXXX"}
                            className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 h-9 text-xs font-mono"
                          />
                        </div>
                        <p className="text-xs text-gray-500">Pay ৳{paymentFee} via the method shown above and submit your transaction ID and recipient number.</p>
                      </div>
                    </div>
                  )}
                  {message && (
                    <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      {message.text}
                    </div>
                  )}
                  <Button
                    onClick={handleRegister}
                    disabled={registering || (event.fee > 0 && !transactionId)}
                    className="bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {registering ? 'Registering...' : 'Register for Event'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Not logged in prompt */}
      {!currentUser && event.status === 'UPCOMING' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardContent className="flex items-center justify-between pt-6">
              <p className="text-sm text-gray-400">Sign in to register for this event</p>
              <Button onClick={() => setCurrentView('login')} size="sm" className="bg-emerald-600 text-white hover:bg-emerald-500">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Registrants List (Admin Only) */}
      {canApproveReg && event.registrations && event.registrations.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader className="cursor-pointer" onClick={() => setShowRegistrants(!showRegistrants)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-400" />
                  Registrants ({event.registrations.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 text-xs font-mono"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await exportEventAttendeesPdf({ event: event as any });
                        toast({
                          title: 'Exporting PDF Roster',
                          description: 'Attendee list formatted for check-in is downloading.',
                        });
                      } catch (err) {
                        toast({
                          title: 'Export Failed',
                          description: 'Failed to generate attendee PDF.',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    <FileDown className="mr-1.5 h-3.5 w-3.5" />
                    Export PDF
                  </Button>
                  {showRegistrants ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </div>
              </div>
            </CardHeader>
            <AnimatePresence>
              {showRegistrants && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <CardContent className="pt-0">
                    <div className="max-h-96 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#10b981 transparent' }}>
                      {event.registrations.map((reg, index) => (
                        <motion.div
                          key={reg.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3"
                        >
                          <div
                            className={`flex items-center gap-3 ${isAdmin ? 'cursor-pointer group' : ''}`}
                            onClick={() => {
                              if (isAdmin && reg.userId) {
                                setSelectedMemberId(reg.userId);
                                setCurrentView('profile');
                              }
                            }}
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-xs font-medium text-emerald-400 group-hover:border-emerald-400 transition-colors">
                              {reg.user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                                {reg.user?.name || 'Unknown'}
                                {isAdmin && <span className="text-[10px] text-gray-500 font-mono group-hover:text-emerald-400">↗</span>}
                              </p>
                              <p className="text-xs text-gray-500">{reg.user?.email}</p>
                              {reg.payment && (
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-mono text-gray-400">
                                    TxID: <span className="text-emerald-400 select-all font-semibold">{reg.payment.transactionId}</span>
                                  </span>
                                  {reg.payment.status === 'PENDING' && (
                                    <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 rounded font-medium">Pending Confirm</span>
                                  )}
                                  {reg.payment.status === 'APPROVED' && (
                                    <span className="text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1 rounded font-medium">Approved</span>
                                  )}
                                  {reg.payment.status === 'VERIFIED' && (
                                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded font-medium">Verified (৳{reg.payment.amount})</span>
                                  )}
                                  {reg.payment.status === 'REJECTED' && (
                                    <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 rounded font-medium">Rejected</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <RegistrationBadge status={reg.status} />
                            <span className="text-xs text-gray-600">{new Date(reg.registeredAt).toLocaleDateString()}</span>
                            {reg.status === 'APPROVED' && (currentUser?.role === 'VERIFIER' || isAdmin || event.verifierId === currentUser?.id || event.createdBy === currentUser?.id) && (
                              (() => {
                                const userAttendance = (event as any).attendance?.find((a: any) => a.userId === reg.userId);
                                const attendanceStatus = userAttendance?.status || 'ABSENT';
                                return (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={updatingAttendanceId === reg.userId}
                                      onClick={() => handleMarkAttendance(reg.userId, 'PRESENT')}
                                      className={`h-7 text-[10px] px-2 ${attendanceStatus === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'border-white/10 text-gray-400 hover:text-white'}`}
                                    >
                                      Present
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={updatingAttendanceId === reg.userId}
                                      onClick={() => handleMarkAttendance(reg.userId, 'LATE')}
                                      className={`h-7 text-[10px] px-2 ${attendanceStatus === 'LATE' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'border-white/10 text-gray-400 hover:text-white'}`}
                                    >
                                      Late
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={updatingAttendanceId === reg.userId}
                                      onClick={() => handleMarkAttendance(reg.userId, 'ABSENT')}
                                      className={`h-7 text-[10px] px-2 ${attendanceStatus === 'ABSENT' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'border-white/10 text-gray-400 hover:text-white'}`}
                                    >
                                      Absent
                                    </Button>
                                  </div>
                                );
                              })()
                            )}
                            {reg.status === 'APPROVED' && currentUser && ['PLATFORM_ADMIN', 'PRESIDENT', 'GS'].includes(currentUser.role) && (
                              (() => {
                                const userCert = (event as any).certificates?.find((c: any) => c.userId === reg.userId);
                                const currentType = userCert?.type || 'PARTICIPATION';
                                return (
                                  <div className="flex items-center gap-1 ml-1 border-l border-white/10 pl-2">
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mr-1">Cert:</span>
                                    {updatingCertUserId === reg.userId ? (
                                      <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                                    ) : (
                                      <select
                                        value={currentType}
                                        onChange={(e) => handleUpdateCertType(reg.userId, e.target.value)}
                                        className="h-7 px-1 rounded border border-white/10 bg-black text-[10px] text-emerald-400 font-medium focus:outline-none focus:border-emerald-500/50"
                                      >
                                        {Object.entries(CERTIFICATE_TYPE_LABELS).map(([val, label]) => (
                                          <option key={val} value={val} className="bg-[#0f0f1f] text-white">
                                            {label}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                );
                              })()
                            )}
                            {canApproveReg && (
                              <>
                                {reg.status === 'PENDING' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 px-2"
                                      disabled={updatingRegId === reg.id}
                                      onClick={async () => {
                                        setUpdatingRegId(reg.id);
                                        try {
                                          const r = await fetch(`/api/events/${event.id}/registrations/${reg.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'APPROVED', role: currentUser?.role }),
                                          });
                                          const d = await r.json();
                                          if (d.success) {
                                            toast({ title: 'Approved', description: `${reg.user?.name} has been approved.` });
                                            loadEvent();
                                          } else {
                                            toast({ title: 'Failed', description: d.error || 'Could not approve', variant: 'destructive' });
                                          }
                                        } catch {
                                          toast({ title: 'Failed', description: 'Network error', variant: 'destructive' });
                                        } finally {
                                          setUpdatingRegId(null);
                                        }
                                      }}
                                    >
                                      {updatingRegId === reg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[10px] border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 px-2"
                                      disabled={updatingRegId === reg.id}
                                      onClick={async () => {
                                        setUpdatingRegId(reg.id);
                                        try {
                                          const r = await fetch(`/api/events/${event.id}/registrations/${reg.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'REJECTED', role: currentUser?.role }),
                                          });
                                          const d = await r.json();
                                          if (d.success) {
                                            toast({ title: 'Rejected', description: `${reg.user?.name} has been rejected.` });
                                            loadEvent();
                                          } else {
                                            toast({ title: 'Failed', description: d.error || 'Could not reject', variant: 'destructive' });
                                          }
                                        } catch {
                                          toast({ title: 'Failed', description: 'Network error', variant: 'destructive' });
                                        } finally {
                                          setUpdatingRegId(null);
                                        }
                                      }}
                                    >
                                      {updatingRegId === reg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {reg.status === 'APPROVED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[10px] border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 px-2"
                                    disabled={updatingRegId === reg.id}
                                    title="Reject if approved by mistake"
                                    onClick={async () => {
                                      setUpdatingRegId(reg.id);
                                      try {
                                        const r = await fetch(`/api/events/${event.id}/registrations/${reg.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ status: 'REJECTED', role: currentUser?.role }),
                                        });
                                        const d = await r.json();
                                        if (d.success) {
                                          toast({ title: 'Rejected', description: `${reg.user?.name}'s registration has been rejected.` });
                                          loadEvent();
                                        } else {
                                          toast({ title: 'Failed', description: d.error || 'Could not reject', variant: 'destructive' });
                                        }
                                      } catch {
                                        toast({ title: 'Failed', description: 'Network error', variant: 'destructive' });
                                      } finally {
                                        setUpdatingRegId(null);
                                      }
                                    }}
                                  >
                                    {updatingRegId === reg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                    Reject
                                  </Button>
                                )}
                                {reg.status === 'REJECTED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 px-2"
                                    disabled={updatingRegId === reg.id}
                                    title="Re-verify if rejected by mistake"
                                    onClick={async () => {
                                      setUpdatingRegId(reg.id);
                                      try {
                                        const r = await fetch(`/api/events/${event.id}/registrations/${reg.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ status: 'APPROVED', role: currentUser?.role }),
                                        });
                                        const d = await r.json();
                                        if (d.success) {
                                          toast({ title: 'Re-verified', description: `${reg.user?.name} has been re-verified and approved.` });
                                          loadEvent();
                                        } else {
                                          toast({ title: 'Failed', description: d.error || 'Could not approve', variant: 'destructive' });
                                        }
                                      } catch {
                                        toast({ title: 'Failed', description: 'Network error', variant: 'destructive' });
                                      } finally {
                                        setUpdatingRegId(null);
                                      }
                                    }}
                                  >
                                    {updatingRegId === reg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                    Re-verify
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-white/10 bg-[#111111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Event</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete &ldquo;{event?.title}&rdquo;? This will also remove all registrations, attendance records, and certificates associated with this event. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={deleting}
              className="gap-2 bg-rose-600 text-white hover:bg-rose-500"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Event
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
