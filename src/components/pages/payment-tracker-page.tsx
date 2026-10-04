'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Clock,
  UserCheck,
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Download,
  Filter,
  Users,
  CreditCard,
  Building2,
  Phone,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Tag,
  Hash,
  AlertCircle,
  Loader2,
  RefreshCw,
  Award,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface UserDossier {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  studentId?: string | null;
  rollNumber?: string | null;
  batch?: string | null;
  department?: string | null;
  phone?: string | null;
  gender?: string | null;
  sentToNumber?: string | null;
  membershipStatus?: string;
}

interface MembershipPayment {
  id: string;
  userId: string;
  amount: number;
  type: string;
  status: string;
  transactionId: string;
  paymentMethod: string;
  sentToNumber?: string | null;
  receiverName?: string | null;
  proofUrl?: string | null;
  createdAt: string;
  user?: UserDossier;
  verifier?: { id: string; name: string } | null;
}

interface EventParticipantRegistration {
  id: string;
  status: string;
  preferredName?: string | null;
  studentId?: string | null;
  department?: string | null;
  institution?: string | null;
  registeredAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    phone?: string | null;
    studentId?: string | null;
    rollNumber?: string | null;
    batch?: string | null;
    department?: string | null;
    gender?: string | null;
  };
  payment?: {
    id: string;
    userId: string;
    amount: number;
    status: string;
    transactionId: string;
    paymentMethod: string;
    receiverName?: string | null;
    sentToNumber?: string | null;
    proofUrl?: string | null;
    createdAt: string;
    verifier?: { id: string; name: string } | null;
  } | null;
}

interface TrackedEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  startDate: string;
  endDate: string;
  venue: string;
  fee: number;
  currentSeats: number;
  maxSeats?: number | null;
  status: string;
  verifierId?: string | null;
  totalCollected: number;
  pendingCollected: number;
  registrationsCount: number;
  paidCount: number;
  pendingCount: number;
  registrations: EventParticipantRegistration[];
}

interface ReceiverSummary {
  receiverKey: string;
  receiverName: string;
  sentToNumber: string;
  totalAmount: number;
  verifiedAmount: number;
  pendingAmount: number;
  totalTransactions: number;
}

interface TrackerData {
  summary: {
    totalVerifiedAmount: number;
    totalPendingAmount: number;
    totalPendingCount: number;
    membershipVerifiedAmount: number;
    membershipTotalCount: number;
    eventVerifiedAmount: number;
    eventsCount: number;
  };
  membershipPayments: MembershipPayment[];
  events: TrackedEvent[];
  receiversSummary: ReceiverSummary[];
}

export function PaymentTrackerPage() {
  const { currentUser } = useAppStore();
  const [data, setData] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'events' | 'receivers'>('members');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [membershipStatusFilter, setMembershipStatusFilter] = useState<string>('ALL');
  const [eventStatusFilter, setEventStatusFilter] = useState<'ALL' | 'COMPLETED' | 'ACTIVE'>('ALL');
  const [paidEventsOnly, setPaidEventsOnly] = useState(true);
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);

  const isAuthorized =
    currentUser &&
    ['TREASURER', 'PRESIDENT', 'GS', 'VP', 'PLATFORM_ADMIN', 'VERIFIER'].includes(currentUser.role);

  const canManagePayments =
    currentUser &&
    ['TREASURER', 'PRESIDENT', 'GS', 'VP', 'PLATFORM_ADMIN'].includes(currentUser.role);

  const loadData = async (showSkeleton = true) => {
    if (!isAuthorized) return;
    if (showSkeleton) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch('/api/payments/tracker');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        toast({
          title: 'Error loading payments',
          description: json.error || 'Failed to fetch payment records',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Network Error',
        description: 'Failed to connect to payment server',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: 'Copied to clipboard', description: text });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  // Quick verify/reject payment action
  const handleVerifyPayment = async (paymentId: string, action: 'VERIFY' | 'REJECT') => {
    if (!currentUser || !canManagePayments) return;
    setActionProcessingId(paymentId);

    try {
      const res = await fetch(`/api/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, verifiedBy: currentUser.id }),
      });
      const d = await res.json();
      if (d.success) {
        toast({
          title: action === 'VERIFY' ? 'Payment Verified' : 'Payment Rejected',
          description: `Transaction has been updated to ${action === 'VERIFY' ? 'VERIFIED' : 'REJECTED'}.`,
        });
        loadData(false);
      } else {
        toast({
          title: 'Update failed',
          description: d.error || 'Could not update payment',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Update failed', description: 'Network error', variant: 'destructive' });
    } finally {
      setActionProcessingId(null);
    }
  };

  // CSV Export for Member Payments
  const exportMemberPaymentsCSV = () => {
    if (!data?.membershipPayments?.length) return;
    const headers = [
      'Name',
      'Student ID',
      'Roll Number',
      'Batch',
      'Department',
      'Gender',
      'Phone',
      'Payment Method',
      'Sent-To Number / Recipient',
      'Transaction ID',
      'Amount (BDT)',
      'Status',
      'Date Submitted',
    ];

    const rows = filteredMemberPayments.map((p) => [
      `"${p.user?.name || 'N/A'}"`,
      `"${p.user?.studentId || 'N/A'}"`,
      `"${p.user?.rollNumber || 'N/A'}"`,
      `"${p.user?.batch || 'N/A'}"`,
      `"${p.user?.department || 'N/A'}"`,
      `"${p.user?.gender || 'Not Specified'}"`,
      `"${p.user?.phone || 'N/A'}"`,
      `"${p.paymentMethod}"`,
      `"${p.sentToNumber || 'Club Official Account'}"`,
      `"${p.transactionId}"`,
      p.amount,
      `"${p.status}"`,
      `"${new Date(p.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cyber_Club_Member_Payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export for Specific Event Roster
  const exportEventRosterCSV = (ev: TrackedEvent) => {
    if (!ev.registrations?.length) return;
    const headers = [
      'Participant Name',
      'Student ID',
      'Department',
      'Contact Phone',
      'Registration Status',
      'Payment Status',
      'Amount (BDT)',
      'Payment Method',
      'Transaction ID',
      'Sent-To Number / Recipient',
      'Registered At',
    ];

    const rows = ev.registrations.map((reg) => [
      `"${reg.user?.name || reg.preferredName || 'N/A'}"`,
      `"${reg.user?.studentId || reg.studentId || 'N/A'}"`,
      `"${reg.user?.department || reg.department || 'N/A'}"`,
      `"${reg.user?.phone || 'N/A'}"`,
      `"${reg.status}"`,
      `"${reg.payment?.status || (ev.fee > 0 ? 'UNPAID' : 'FREE')}"`,
      reg.payment?.amount ?? ev.fee,
      `"${reg.payment?.paymentMethod || 'N/A'}"`,
      `"${reg.payment?.transactionId || 'N/A'}"`,
      `"${reg.payment?.sentToNumber || reg.payment?.receiverName || 'N/A'}"`,
      `"${new Date(reg.registeredAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Event_Roster_${ev.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Member Payments
  const filteredMemberPayments = useMemo(() => {
    if (!data?.membershipPayments) return [];
    return data.membershipPayments.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        p.transactionId.toLowerCase().includes(q) ||
        p.user?.name?.toLowerCase().includes(q) ||
        p.user?.studentId?.toLowerCase().includes(q) ||
        p.user?.rollNumber?.toLowerCase().includes(q) ||
        p.user?.phone?.toLowerCase().includes(q) ||
        (p.sentToNumber && p.sentToNumber.toLowerCase().includes(q));

      const matchesStatus =
        membershipStatusFilter === 'ALL'
          ? true
          : membershipStatusFilter === 'PREVIOUS_MEMBER'
            ? p.paymentMethod === 'PREVIOUS_MEMBER'
            : p.status === membershipStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data?.membershipPayments, search, membershipStatusFilter]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (!data?.events) return [];
    const now = new Date();

    return data.events.filter((ev) => {
      // Fee filter
      if (paidEventsOnly && ev.fee <= 0) return false;

      // Status filter
      const eventEndDate = new Date(ev.endDate);
      const isPast = eventEndDate < now || ev.status === 'COMPLETED';

      if (eventStatusFilter === 'COMPLETED' && !isPast) return false;
      if (eventStatusFilter === 'ACTIVE' && isPast) return false;

      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const matchesEvent =
          ev.title.toLowerCase().includes(q) ||
          ev.category.toLowerCase().includes(q) ||
          ev.venue.toLowerCase().includes(q);

        const matchesRegistrant = ev.registrations.some(
          (r) =>
            r.user?.name?.toLowerCase().includes(q) ||
            r.user?.studentId?.toLowerCase().includes(q) ||
            r.payment?.transactionId?.toLowerCase().includes(q) ||
            (r.payment?.sentToNumber && r.payment.sentToNumber.toLowerCase().includes(q))
        );

        return matchesEvent || matchesRegistrant;
      }

      return true;
    });
  }, [data?.events, paidEventsOnly, eventStatusFilter, search]);

  if (!isAuthorized) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center p-6 space-y-4">
        <ShieldCheck className="h-16 w-16 text-amber-500/80 animate-pulse" />
        <h2 className="text-xl font-bold text-white">Restricted Access</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Only authorized club leadership (President, General Secretary, Treasurer, Vice President, Platform Admin) can access the Central Payment Tracker.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-[#071612] via-[#091a18] to-[#040e0b] p-6 shadow-2xl"
      >
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl font-mono">
                  Central Payment Tracker
                </h1>
                <p className="text-xs text-gray-400">
                  Comprehensive audit ledger for membership dues, event ticket revenues, and executive cash holdings.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(false)}
              disabled={refreshing}
              className="border-white/10 bg-white/5 text-gray-300 hover:text-white text-xs h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* 2. Top KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Total Club Collections"
          value={`৳${(data?.summary?.totalVerifiedAmount || 0).toLocaleString()}`}
          trend="up"
          delay={0}
        />
        <StatCard
          icon={Clock}
          label="Pending Verification"
          value={`৳${(data?.summary?.totalPendingAmount || 0).toLocaleString()} (${data?.summary?.totalPendingCount || 0})`}
          trend={(data?.summary?.totalPendingCount || 0) > 5 ? 'down' : 'up'}
          delay={0.05}
        />
        <StatCard
          icon={UserCheck}
          label="Membership Funds"
          value={`৳${(data?.summary?.membershipVerifiedAmount || 0).toLocaleString()}`}
          delay={0.1}
        />
        <StatCard
          icon={Calendar}
          label="Event Ticket Revenues"
          value={`৳${(data?.summary?.eventVerifiedAmount || 0).toLocaleString()}`}
          delay={0.15}
        />
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'members'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="h-4 w-4" />
            Member Registrations ({data?.membershipPayments?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'events'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Event Registrations ({data?.events?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('receivers')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              activeTab === 'receivers'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            Receiver Balances ({data?.receiversSummary?.length || 0})
          </button>
        </div>

        {/* Export Button for Active Tab */}
        {activeTab === 'members' && (
          <Button
            onClick={exportMemberPaymentsCSV}
            size="sm"
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs h-9 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export Member Ledger (CSV)
          </Button>
        )}
      </div>

      {/* 4. Global Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            activeTab === 'members'
              ? 'Search member by Name, Student ID, Phone, TrxID, or Sent-To Number...'
              : activeTab === 'events'
                ? 'Search events or participants by Title, Student ID, TrxID...'
                : 'Search receivers...'
          }
          className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-600 h-10 text-xs font-mono"
        />
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-white/5 border border-white/5" />
          ))}
        </div>
      ) : (
        <>
          {/* ============================================================== */}
          {/* TAB 1: MEMBER REGISTRATIONS LEDGER                            */}
          {/* ============================================================== */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Status Filters */}
              <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
                {[
                  { key: 'ALL', label: 'All Applications' },
                  { key: 'PENDING', label: 'Pending Verification' },
                  { key: 'VERIFIED', label: 'Verified / Approved' },
                  { key: 'REJECTED', label: 'Rejected' },
                  { key: 'PREVIOUS_MEMBER', label: 'Previous Members (৳0)' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setMembershipStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      membershipStatusFilter === tab.key
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filteredMemberPayments.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-white/5 bg-[#111]/40">
                  <UserCheck className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-mono">No member payment records found matching criteria</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMemberPayments.map((p) => {
                    const isPrevMember = p.paymentMethod === 'PREVIOUS_MEMBER';
                    return (
                      <Card
                        key={p.id}
                        className={`border-white/5 bg-[#0e161c]/80 backdrop-blur transition-all hover:border-white/10 ${
                          p.status === 'PENDING'
                            ? 'border-l-4 border-l-amber-400'
                            : p.status === 'VERIFIED' || p.status === 'APPROVED'
                              ? 'border-l-4 border-l-emerald-400'
                              : 'border-l-4 border-l-red-400'
                        }`}
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            {/* Left: Applicant Academic Dossier */}
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base font-bold text-white">{p.user?.name || 'Applicant'}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-mono ${
                                    p.status === 'PENDING'
                                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                                      : p.status === 'VERIFIED' || p.status === 'APPROVED'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                        : 'border-red-500/30 bg-red-500/10 text-red-300'
                                  }`}
                                >
                                  {p.status}
                                </Badge>
                                <span className="text-xs font-mono font-bold text-emerald-400">
                                  {isPrevMember ? '৳0 (Pre-cleared)' : `৳${p.amount}`}
                                </span>
                              </div>

                              {/* Academic Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-400 font-mono">
                                <div>
                                  <span className="text-gray-500 block text-[10px]">Student ID</span>
                                  <span className="text-gray-200">{p.user?.studentId || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">Roll No</span>
                                  <span className="text-gray-200">{p.user?.rollNumber || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">Batch</span>
                                  <span className="text-gray-200">{p.user?.batch || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">Gender</span>
                                  <span className="text-gray-200">{p.user?.gender || 'Not Specified'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                                <span>Dept: <strong className="text-gray-300">{p.user?.department || 'N/A'}</strong></span>
                                {p.user?.phone && (
                                  <span>Phone: <strong className="text-emerald-400 font-mono">{p.user.phone}</strong></span>
                                )}
                              </div>
                            </div>

                            {/* Middle: Financial & Receiver Audit */}
                            <div className="space-y-1.5 bg-black/30 border border-white/5 rounded-xl p-3 text-xs font-mono min-w-[260px]">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Method:</span>
                                <span className="text-cyan-300 font-bold">{p.paymentMethod}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Sent-To Number:</span>
                                <span className="text-amber-300 font-semibold truncate max-w-[150px]">
                                  {p.sentToNumber || p.user?.sentToNumber || 'Club Official Account'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">TrxID:</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(p.transactionId, p.id)}
                                  className="flex items-center gap-1 text-emerald-400 font-bold hover:underline"
                                >
                                  <span>{p.transactionId}</span>
                                  {copiedId === p.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </div>
                              <div className="text-[10px] text-gray-500 pt-1 border-t border-white/5">
                                Submitted {new Date(p.createdAt).toLocaleDateString()}
                              </div>
                            </div>

                            {/* Right: Quick Verification Actions */}
                            {canManagePayments && (
                              <div className="flex items-center gap-2">
                                {p.status === 'PENDING' && (
                                  <>
                                    <Button
                                      size="sm"
                                      disabled={actionProcessingId === p.id}
                                      onClick={() => handleVerifyPayment(p.id, 'VERIFY')}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3"
                                    >
                                      {actionProcessingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                                      Verify
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={actionProcessingId === p.id}
                                      onClick={() => handleVerifyPayment(p.id, 'REJECT')}
                                      className="border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs h-8 px-3"
                                    >
                                      <XCircle className="h-3.5 w-3.5 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {(p.status === 'APPROVED' || p.status === 'VERIFIED') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actionProcessingId === p.id}
                                    onClick={() => handleVerifyPayment(p.id, 'REJECT')}
                                    className="border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs h-8 px-3"
                                    title="Reject if approved by mistake"
                                  >
                                    {actionProcessingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                                    Reject
                                  </Button>
                                )}
                                {p.status === 'REJECTED' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actionProcessingId === p.id}
                                    onClick={() => handleVerifyPayment(p.id, 'VERIFY')}
                                    className="border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs h-8 px-3"
                                    title="Re-verify if rejected by mistake"
                                  >
                                    {actionProcessingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                                    Re-verify
                                  </Button>
                                )}
                              </div>
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

          {/* ============================================================== */}
          {/* TAB 2: EVENT REGISTRATIONS (GROUPED BY EVENT)                   */}
          {/* ============================================================== */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              {/* Event Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {[
                    { key: 'ALL', label: 'All Events' },
                    { key: 'COMPLETED', label: 'Completed Events' },
                    { key: 'ACTIVE', label: 'Active / Upcoming' },
                  ].map((filterTab) => (
                    <button
                      key={filterTab.key}
                      onClick={() => setEventStatusFilter(filterTab.key as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        eventStatusFilter === filterTab.key
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {filterTab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-mono text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paidEventsOnly}
                      onChange={(e) => setPaidEventsOnly(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/30"
                    />
                    <span>Paid Events Only</span>
                  </label>
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-white/5 bg-[#111]/40">
                  <Calendar className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-mono">No events found matching your filter criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((ev) => {
                    const isExpanded = expandedEventIds.has(ev.id);
                    const isFree = ev.fee <= 0;

                    return (
                      <Card
                        key={ev.id}
                        className="border-white/10 bg-[#0c141d]/90 backdrop-blur overflow-hidden transition-all"
                      >
                        {/* Event Header Banner */}
                        <div className="p-4 sm:p-5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-[10px] font-mono">
                                {ev.category}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] font-mono text-gray-400">
                                {new Date(ev.startDate).toLocaleDateString()}
                              </Badge>
                              {isFree ? (
                                <Badge className="bg-gray-500/20 text-gray-300 text-[10px] font-mono">Free Event</Badge>
                              ) : (
                                <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] font-mono">
                                  Ticket: ৳{ev.fee}
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-white tracking-tight">{ev.title}</h3>
                            <p className="text-xs text-gray-400">Venue: {ev.venue}</p>
                          </div>

                          {/* Event Financial Metrics */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-center">
                              <span className="text-[10px] font-mono text-gray-400 block uppercase">Collected Revenue</span>
                              <span className="text-sm font-bold font-mono text-emerald-300">৳{ev.totalCollected.toLocaleString()}</span>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-center">
                              <span className="text-[10px] font-mono text-gray-400 block uppercase">Paid / Registered</span>
                              <span className="text-sm font-bold font-mono text-white">
                                {ev.paidCount} / {ev.registrationsCount}
                              </span>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportEventRosterCSV(ev)}
                              className="border-white/10 text-gray-300 hover:text-white text-xs h-9 gap-1"
                              title="Download Attendance & Payment Sheet"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Export Sheet
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => toggleEventExpanded(ev.id)}
                              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-9 gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5" />
                                  Hide Roster
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3.5 w-3.5" />
                                  View Roster ({ev.registrations.length})
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Collapsible Participant Payment Roster */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-white/5 bg-black/40 p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs font-mono text-gray-400">
                                <span>Participant Payments & Roster</span>
                                <span>Total Attendees: {ev.registrations.length}</span>
                              </div>

                              {ev.registrations.length === 0 ? (
                                <p className="text-center py-6 text-xs text-gray-500 font-mono">No registrations recorded for this event yet.</p>
                              ) : (
                                <div className="divide-y divide-white/5">
                                  {ev.registrations.map((reg) => {
                                    const payment = reg.payment;
                                    return (
                                      <div key={reg.id} className="py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-white">{reg.user?.name || reg.preferredName || 'Participant'}</span>
                                            <Badge
                                              variant="outline"
                                              className={`text-[9px] font-mono ${
                                                reg.status === 'APPROVED'
                                                  ? 'border-emerald-500/30 text-emerald-400'
                                                  : reg.status === 'PENDING'
                                                    ? 'border-amber-500/30 text-amber-400'
                                                    : 'border-red-500/30 text-red-400'
                                              }`}
                                            >
                                              Reg: {reg.status}
                                            </Badge>
                                            {payment && (
                                              <Badge
                                                className={`text-[9px] font-mono ${
                                                  payment.status === 'VERIFIED' || payment.status === 'APPROVED'
                                                    ? 'bg-emerald-500/20 text-emerald-300'
                                                    : 'bg-amber-500/20 text-amber-300'
                                                }`}
                                              >
                                                Payment: {payment.status}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3 text-xs text-gray-400 font-mono flex-wrap">
                                            <span>ID: <strong className="text-gray-300">{reg.user?.studentId || reg.studentId || 'N/A'}</strong></span>
                                            <span>Dept: <strong className="text-gray-300">{reg.user?.department || reg.department || 'N/A'}</strong></span>
                                            {reg.user?.phone && <span>Phone: <strong className="text-emerald-400">{reg.user.phone}</strong></span>}
                                          </div>
                                        </div>

                                        {/* Payment Details & Quick Actions */}
                                        <div className="flex items-center gap-3 text-xs font-mono bg-white/[0.02] p-2 rounded-lg border border-white/5 flex-wrap">
                                          <div>
                                            <span className="text-[10px] text-gray-500 block">Method</span>
                                            <span className="text-white">{payment?.paymentMethod || (isFree ? 'Free' : 'Unpaid')}</span>
                                          </div>
                                          <div>
                                            <span className="text-[10px] text-gray-500 block">Sent-To Number</span>
                                            <span className="text-amber-300">{payment?.sentToNumber || 'N/A'}</span>
                                          </div>
                                          <div>
                                            <span className="text-[10px] text-gray-500 block">TrxID</span>
                                            {payment?.transactionId ? (
                                              <button
                                                type="button"
                                                onClick={() => handleCopy(payment.transactionId, reg.id)}
                                                className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                                              >
                                                <span>{payment.transactionId}</span>
                                                {copiedId === reg.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                              </button>
                                            ) : (
                                              <span className="text-gray-500">N/A</span>
                                            )}
                                          </div>

                                          {/* Mistake correction actions for event payments */}
                                          {canManagePayments && payment && (
                                            <div className="flex items-center gap-1.5 sm:border-l sm:border-white/10 sm:pl-2">
                                              {payment.status === 'PENDING' && (
                                                <>
                                                  <Button
                                                    size="sm"
                                                    disabled={actionProcessingId === payment.id}
                                                    onClick={() => handleVerifyPayment(payment.id, 'VERIFY')}
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] h-7 px-2"
                                                  >
                                                    Verify
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={actionProcessingId === payment.id}
                                                    onClick={() => handleVerifyPayment(payment.id, 'REJECT')}
                                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] h-7 px-2"
                                                  >
                                                    Reject
                                                  </Button>
                                                </>
                                              )}
                                              {(payment.status === 'APPROVED' || payment.status === 'VERIFIED') && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  disabled={actionProcessingId === payment.id}
                                                  onClick={() => handleVerifyPayment(payment.id, 'REJECT')}
                                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-[10px] h-7 px-2"
                                                  title="Reject if approved by mistake"
                                                >
                                                  Reject
                                                </Button>
                                              )}
                                              {payment.status === 'REJECTED' && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  disabled={actionProcessingId === payment.id}
                                                  onClick={() => handleVerifyPayment(payment.id, 'VERIFY')}
                                                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-[10px] h-7 px-2"
                                                  title="Re-verify if rejected by mistake"
                                                >
                                                  Re-verify
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: EXECUTIVE CASH & MFS HOLDING BALANCES                   */}
          {/* ============================================================== */}
          {activeTab === 'receivers' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/90 font-mono">
                💡 This ledger aggregates all incoming member dues and event fees categorized by which personal SIM account or campus desk received the funds. Executive leadership can use this to reconcile physical cash handovers with the Central Treasury.
              </div>

              {(!data?.receiversSummary || data.receiversSummary.length === 0) ? (
                <div className="text-center py-16 rounded-xl border border-white/5 bg-[#111]/40">
                  <Smartphone className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-mono">No receiver activity recorded yet</p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {data.receiversSummary.map((rec) => (
                    <Card key={rec.receiverKey} className="border-white/10 bg-[#0d1620]/90 backdrop-blur">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs text-gray-400 font-mono block">Receiver Channel / Holder</span>
                            <h4 className="text-base font-bold text-white">{rec.receiverName}</h4>
                            <p className="text-xs font-mono text-emerald-400 mt-0.5">{rec.sentToNumber}</p>
                          </div>
                          <Badge variant="outline" className="border-amber-500/30 text-amber-300 font-mono text-xs">
                            {rec.totalTransactions} Txns
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 text-xs font-mono">
                          <div className="rounded-lg bg-black/40 p-2.5">
                            <span className="text-gray-500 block text-[10px]">Verified Held</span>
                            <span className="text-emerald-400 font-bold text-sm">৳{rec.verifiedAmount.toLocaleString()}</span>
                          </div>
                          <div className="rounded-lg bg-black/40 p-2.5">
                            <span className="text-gray-500 block text-[10px]">Pending Check</span>
                            <span className="text-amber-400 font-bold text-sm">৳{rec.pendingAmount.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                          <span className="text-gray-400">Total Volume:</span>
                          <span className="text-white font-bold">৳{rec.totalAmount.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
