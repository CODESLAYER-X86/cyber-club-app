'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, Award, CheckCircle, AlertTriangle, Share2, Pencil, Loader2, User, ChevronDown, ChevronUp, ShieldCheck, Eye } from 'lucide-react';
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

interface EventDetailData extends Event {
  creator?: Pick<UserType, 'id' | 'name' | 'email' | 'avatar' | 'role'>;
  verifier?: Pick<UserType, 'id' | 'name' | 'email' | 'avatar' | 'role'>;
  registrations?: (EventRegistration & {
    user?: Pick<UserType, 'id' | 'name' | 'email' | 'avatar' | 'role' | 'membershipStatus'>;
  })[];
  _count?: { registrations: number };
}

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
        setMessage({ type: 'success', text: 'Successfully registered! Your registration is pending approval.' });
        setUserRegistration(data.data.registration || { status: 'PENDING' });
        setEvent(prev => prev ? { ...prev, currentSeats: prev.currentSeats + 1 } : prev);
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
  const canRegister = currentUser && isMember && !isFull && event.status === 'UPCOMING' && !userRegistration;
  const isAdmin = currentUser && ['PLATFORM_ADMIN', 'PRESIDENT', 'VP', 'GS'].includes(currentUser.role);
  const canEdit = currentUser && ['PLATFORM_ADMIN', 'PRESIDENT', 'MEDIA'].includes(currentUser.role);
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
            <Button variant="outline" size="sm" onClick={handleEdit} className="border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-emerald-500/30">
              <Pencil className="mr-2 h-4 w-4" /> Edit Event
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-cyan-500/20 bg-cyan-500/5 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                  {userRegistration.status === 'APPROVED' ? (
                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                  ) : userRegistration.status === 'REJECTED' ? (
                    <AlertTriangle className="h-6 w-6 text-red-400" />
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
      )}

      {/* Registration Section */}
      {currentUser && event.status === 'UPCOMING' && !userRegistration && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg text-white">Registration</CardTitle>
            </CardHeader>
            <CardContent>
              {!isMember && currentUser.role === 'GUEST' ? (
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm">You need to be an approved member to register for events.</p>
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
    </div>
  );
}
