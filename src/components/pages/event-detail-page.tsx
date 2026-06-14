'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, Award, CheckCircle, AlertTriangle, Share2, Pencil, Loader2, User, ChevronDown, ChevronUp, ShieldCheck, Eye, Trash2, XCircle, Flag } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { Event, EventRegistration, User as UserType } from '@/types';
import { EVENT_TYPE_LABELS, EVENT_CATEGORY_LABELS, ROLE_LABELS } from '@/types';
import { EventBadge, RegistrationBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

type EventDetailData = Omit<Event, 'registrations'> & {
  creator?: Pick<UserType, 'id' | 'name' | 'email' | 'avatar' | 'role'>;
  verifier?: Pick<UserType, 'id' | 'name' | 'email' | 'avatar' | 'role'>;
  registrations?: (EventRegistration & {
    user?: Pick<UserType, 'id' | 'name' | 'email' | 'avatar' | 'role' | 'membershipStatus'>;
  })[];
  _count?: { registrations: number };
};

export function EventDetailPage() {
  const { currentUser, selectedEventId, setCurrentView } = useAppStore();
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userRegistration, setUserRegistration] = useState<EventRegistration | null>(null);
  const [showRegistrants, setShowRegistrants] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingRegId, setUpdatingRegId] = useState<string | null>(null);

  // Enhanced certificate states
  const [prefName, setPrefName] = useState('');
  const [studId, setStudId] = useState('');
  const [dept, setDept] = useState('');
  const [inst, setInst] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [certificateStatus, setCertificateStatus] = useState<string>('REGISTERED');
  const [updatingAttendanceId, setUpdatingAttendanceId] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${selectedEventId}`);
      const data = await res.json();
      if (data.success) {
        setEvent(data.data.event);
        // Check if current user is already registered
        if (currentUser && data.data.event.registrations) {
          const reg = data.data.event.registrations.find(
            (r: EventRegistration) => r.userId === currentUser.id
          );
          setUserRegistration(reg || null);

          // Fetch certificate status if registered
          try {
            const certRes = await fetch(`/api/certificates?userId=${currentUser.id}`);
            const certData = await certRes.json();
            if (certData.success && certData.data.certificates) {
              const userCert = certData.data.certificates.find((c: any) => c.eventId === selectedEventId);
              if (userCert) {
                setCertificateStatus(userCert.status);
              }
            }
          } catch (e) {
            console.error("Failed to load certificate status:", e);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, currentUser]);

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
    if (!userRegistration || !currentUser || !event) return;
    setSavingName(true);
    try {
      const res = await fetch(`/api/events/${event.id}/registrations/${userRegistration.id}/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredName: prefName,
          studentId: studId,
          department: dept,
          institution: inst,
          requestingUserId: currentUser.id,
          requestingUserRole: currentUser.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Information Saved', description: 'Your certificate details have been updated.' });
        loadEvent();
      } else {
        toast({ title: 'Failed to Save', description: data.error || 'Could not update information', variant: 'destructive' });
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
        loadEvent();
      } else {
        toast({ title: 'Error', description: d.error || 'Failed to update attendance', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setUpdatingAttendanceId(null);
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
        body: JSON.stringify({ userId: currentUser.id, transactionId: event.fee > 0 ? transactionId : undefined }),
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
    const url = `${window.location.origin}?event=${event?.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('Link copied!');
    } catch {
      setShareMsg('Could not copy link');
    }
    setTimeout(() => setShareMsg(null), 2000);
  };

  const handleEdit = () => {
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
  if (!event) return <div className="py-16 text-center text-gray-500">Event not found</div>;

  const seatPercent = event.maxSeats ? Math.min((event.currentSeats / event.maxSeats) * 100, 100) : 0;
  const isFull = event.maxSeats ? event.currentSeats >= event.maxSeats : false;
  const isMember = currentUser?.membershipStatus === 'ACTIVE';
  // PUBLIC events: anyone logged in can register
  // MEMBER_ONLY events: only active members can register
  // PAID events: anyone logged in can register (payment required)
  // LIMITED events: anyone logged in can register (subject to seat availability)
  const canRegisterForEventType = event.type === 'MEMBER_ONLY' ? isMember : !!currentUser;
  const canRegister = canRegisterForEventType && !isFull && event.status === 'UPCOMING' && !userRegistration;
  const isAdmin = currentUser && ['PLATFORM_ADMIN', 'PRESIDENT', 'VP', 'GS'].includes(currentUser.role);
  const canEdit = currentUser && ['PLATFORM_ADMIN', 'PRESIDENT', 'MEDIA'].includes(currentUser.role);
  const canDelete = currentUser && ['PLATFORM_ADMIN', 'PRESIDENT', 'MEDIA', 'VP', 'GS'].includes(currentUser.role);
  const registrationCount = event._count?.registrations ?? event.registrations?.length ?? event.currentSeats;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setCurrentView('events')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
        </Button>
        <div className="flex items-center gap-2">
          {/* Share Button */}
          <div className="relative">
            <Button variant="outline" size="sm" onClick={handleShare} className="border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-emerald-500/30">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            {shareMsg && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -bottom-8 right-0 whitespace-nowrap rounded bg-emerald-600 px-2 py-1 text-xs text-white"
              >
                {shareMsg}
              </motion.div>
            )}
          </div>
          {/* Edit Button */}
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentView('certificate-designer')} className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-white">
                <Award className="mr-2 h-4 w-4" /> Design Certificate
              </Button>
              <Button variant="outline" size="sm" onClick={handleEdit} className="border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-emerald-500/30">
                <Pencil className="mr-2 h-4 w-4" /> Edit Event
              </Button>
            </div>
          )}
          {/* Delete Button */}
          {canDelete && (
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)} className="border-red-500/20 bg-red-500/5 text-red-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/40">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
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
              <Badge variant="outline" className="border-white/10 text-gray-400">{EVENT_TYPE_LABELS[event.type]}</Badge>
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
                  <Users className="h-5 w-5 text-purple-400" />
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
                  <p className="text-sm">You need to be an approved member to register for this event.</p>
                </div>
              ) : isFull ? (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm">This event is fully booked.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {event.fee > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400">Transaction ID (Payment Proof)</label>
                      <Input
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="TXN-2025-XXXXX"
                        className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
                      />
                      <p className="text-xs text-gray-500">Pay ৳{event.fee} via bKash/Nagad and enter the transaction ID</p>
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
      {isAdmin && event.registrations && event.registrations.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader className="cursor-pointer" onClick={() => setShowRegistrants(!showRegistrants)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-400" />
                  Registrants ({event.registrations.length})
                </CardTitle>
                {showRegistrants ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
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
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-xs font-medium text-emerald-400">
                              {reg.user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{reg.user?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{reg.user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <RegistrationBadge status={reg.status} />
                            <span className="text-xs text-gray-600">{new Date(reg.registeredAt).toLocaleDateString()}</span>
                            {reg.status === 'APPROVED' && (currentUser?.role === 'VERIFIER' || isAdmin) && (
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
                            {reg.status === 'PENDING' && isAdmin && (
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
