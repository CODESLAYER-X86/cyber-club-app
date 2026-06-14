'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  AlertTriangle,
  FileCheck,
  Loader2,
  ChevronDown,
  Ban,
  Eye,
  Filter,
  ShieldAlert,
  User,
  Calendar,
  Hash,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { toast } from '@/hooks/use-toast';
import type {
  Certificate,
  CertificateType,
  CertificateStatus,
  CertificateAuditLog,
  CertificateAuditAction,
  EligibilityCheck,
  Event,
  EventRegistration,
} from '@/types';
import { CERTIFICATE_TYPE_LABELS } from '@/types';
import {
  CertificateStatusBadge,
  CertificateTypeBadge,
} from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

// ──────────────────────────────────────────
// Animation variants
// ──────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ──────────────────────────────────────────
// Helper: Relative time
// ──────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString();
}

// ──────────────────────────────────────────
// Audit action color mapping
// ──────────────────────────────────────────

const AUDIT_ACTION_COLORS: Record<CertificateAuditAction, string> = {
  ISSUED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  APPROVED: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  REVOKED: 'bg-red-500/15 text-red-400 border-red-500/20',
  ELIGIBILITY_CHECKED: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  VIEWED: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  SHARED: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  delay: number;
  loading: boolean;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  delay,
  loading,
}: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#111]/60 px-4 py-3"
  >
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}
    >
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-lg font-bold text-white">
        {loading ? (
          <Skeleton className="h-6 w-8 bg-white/10" />
        ) : (
          value
        )}
      </p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
        {label}
      </p>
    </div>
  </motion.div>
);

// ──────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────

export function CertificateAuthorityPage() {
  const { currentUser } = useAppStore();
  const role = currentUser?.role ?? 'GUEST';

  const isGS = role === 'GS';
  const isPresident = role === 'PRESIDENT';
  const isAdmin = role === 'PLATFORM_ADMIN';

  // Determine default tab based on role
  const getDefaultTab = () => {
    if (isGS) return 'issue';
    if (isPresident) return 'pending-approval';
    if (isAdmin) return 'audit';
    return 'audit';
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab);

  // Stats
  const [stats, setStats] = useState({
    totalIssued: 0,
    pendingApproval: 0,
    valid: 0,
    revoked: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // ─── Tab 1: Issue Certificate ─────────────
  const [completedEvents, setCompletedEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [eligibilityMap, setEligibilityMap] = useState<
    Record<string, EligibilityCheck>
  >({});
  const [eventsLoading, setEventsLoading] = useState(false);
  const [regsLoading, setRegsLoading] = useState(false);
  const [issuingMemberId, setIssuingMemberId] = useState<string | null>(null);

  // ─── Tab 2: Pending Approval ──────────────
  const [pendingCerts, setPendingCerts] = useState<Certificate[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [selectedPresidentEventId, setSelectedPresidentEventId] = useState<string>('');
  const [presidentCerts, setPresidentCerts] = useState<Certificate[]>([]);
  const [selectedCertIds, setSelectedCertIds] = useState<string[]>([]);
  const [presidentLoading, setPresidentLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // ─── Tab 3: Revoke Certificate ────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Certificate[]>([]);
  const [searching, setSearching] = useState(false);
  const [revokeCert, setRevokeCert] = useState<Certificate | null>(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  // ─── Tab 4: Audit Trail ──────────────────
  const [auditLogs, setAuditLogs] = useState<CertificateAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState<string>('ALL');

  // ─── Issue form state ────────────────────
  const [certType, setCertType] = useState<CertificateType>('PARTICIPATION');
  const [certScore, setCertScore] = useState('');

  // ──────────────────────────────────────────
  // Data fetching
  // ──────────────────────────────────────────

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await fetch('/api/certificates');
      const d = await r.json();
      if (d.success) {
        const certs: Certificate[] = d.data.certificates || [];
        setStats({
          totalIssued: certs.length,
          pendingApproval: certs.filter(
            (c) => c.status === 'ELIGIBLE'
          ).length,
          valid: certs.filter((c) => ['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(c.status)).length,
          revoked: certs.filter((c) => c.status === 'REVOKED').length,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch completed events
  const fetchCompletedEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const r = await fetch('/api/events');
      const d = await r.json();
      if (d.success) {
        setCompletedEvents(d.data.events || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  // Fetch registrations for selected event
  const fetchRegistrations = useCallback(
    async (eventId: string) => {
      setRegsLoading(true);
      setEligibilityMap({});
      try {
        const r = await fetch(`/api/events/${eventId}/registrations`);
        const d = await r.json();
        if (d.success) {
          const regs: EventRegistration[] =
            d.data.registrations || d.data || [];
          setRegistrations(regs);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setRegsLoading(false);
      }
    },
    []
  );

  // Check eligibility for a user
  const checkEligibility = useCallback(
    async (userId: string, eventId: string) => {
      try {
        const r = await fetch(
          `/api/certificates/eligibility/${userId}/${eventId}`
        );
        const d = await r.json();
        if (d.success) {
          const eligibility: EligibilityCheck = d.data.eligibility || d.data;
          setEligibilityMap((prev) => ({ ...prev, [userId]: eligibility }));
          return eligibility;
        }
      } catch (e) {
        console.error(e);
      }
      return null;
    },
    []
  );

  // Fetch pending approval certs
  const fetchPendingCerts = useCallback(async () => {
    setPendingLoading(true);
    try {
      const r = await fetch('/api/certificates?status=PENDING_APPROVAL');
      const d = await r.json();
      if (d.success) {
        setPendingCerts(d.data.certificates || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const r = await fetch('/api/certificates/audit-logs');
      const d = await r.json();
      if (d.success) {
        setAuditLogs(d.data.auditLogs || d.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  // Fetch President certifications for the selected event
  const fetchPresidentCerts = useCallback(async (eventId: string) => {
    if (!eventId) return;
    setPresidentLoading(true);
    try {
      const r = await fetch(`/api/certificates?eventId=${eventId}`);
      const d = await r.json();
      if (d.success) {
        setPresidentCerts(d.data.certificates || []);
        setSelectedCertIds([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPresidentLoading(false);
    }
  }, []);

  // ──────────────────────────────────────────
  // Effects
  // ──────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => {
      fetchStats();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchStats]);

  useEffect(() => {
    if ((isGS && activeTab === 'issue') || (isPresident && activeTab === 'pending-approval')) {
      const t = setTimeout(() => {
        fetchCompletedEvents();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isGS, isPresident, activeTab, fetchCompletedEvents]);

  // When selectedPresidentEventId changes, load its certificates
  useEffect(() => {
    const t = setTimeout(() => {
      if (selectedPresidentEventId) {
        fetchPresidentCerts(selectedPresidentEventId);
      } else {
        setPresidentCerts([]);
        setSelectedCertIds([]);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [selectedPresidentEventId, fetchPresidentCerts]);

  useEffect(() => {
    if (isPresident && activeTab === 'pending-approval') {
      const t = setTimeout(() => {
        fetchPendingCerts();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isPresident, activeTab, fetchPendingCerts]);

  useEffect(() => {
    if (activeTab === 'audit') {
      const t = setTimeout(() => {
        fetchAuditLogs();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [activeTab, fetchAuditLogs]);

  // When event is selected, fetch registrations and auto-check eligibility
  useEffect(() => {
    const t = setTimeout(() => {
      if (selectedEventId) {
        fetchRegistrations(selectedEventId);
      } else {
        setRegistrations([]);
        setEligibilityMap({});
      }
    }, 0);
    return () => clearTimeout(t);
  }, [selectedEventId, fetchRegistrations]);

  // Auto-check eligibility for all registrations
  useEffect(() => {
    if (registrations.length > 0 && selectedEventId) {
      const t = setTimeout(() => {
        registrations.forEach((reg) => {
          if (!eligibilityMap[reg.userId]) {
            checkEligibility(reg.userId, selectedEventId);
          }
        });
      }, 0);
      return () => clearTimeout(t);
    }
  }, [registrations, selectedEventId, eligibilityMap, checkEligibility]);

  // ──────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────

  const handleIssueCertificate = async (
    userId: string,
    eventId: string,
    type: CertificateType,
    score?: number
  ) => {
    setIssuingMemberId(userId);
    try {
      const eligibility = eligibilityMap[userId];
      const body: Record<string, unknown> = {
        userId,
        eventId,
        type,
        score: score || undefined,
        issuedBy: currentUser?.id,
        role: currentUser?.role,
        eligibilityVerified: eligibility?.eligible ?? false,
        eligibilityDetails: eligibility
          ? eligibility.checks
          : undefined,
      };

      // EXCELLENCE type automatically goes to PENDING_APPROVAL (handled by API)

      const r = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.success) {
        // Re-check eligibility for this user
        await checkEligibility(userId, eventId);
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIssuingMemberId(null);
    }
  };

  const [authorizingBatch, setAuthorizingBatch] = useState(false);

  const handleAuthorizeBatch = async (idsToApprove: string[]) => {
    if (idsToApprove.length === 0) return;
    setAuthorizingBatch(true);
    try {
      await Promise.all(
        idsToApprove.map((certId) =>
          fetch(`/api/certificates/${certId}/approve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ performedBy: currentUser?.id, role: currentUser?.role }),
          })
        )
      );
      toast({ title: 'Success', description: `Successfully authorized ${idsToApprove.length} certificate(s).` });
      if (selectedPresidentEventId) {
        fetchPresidentCerts(selectedPresidentEventId);
      }
      fetchStats();
      fetchPendingCerts();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to authorize some certificates.', variant: 'destructive' });
    } finally {
      setAuthorizingBatch(false);
      setSelectedCertIds([]);
    }
  };

  const handleRejectBatch = async () => {
    const idsToReject = rejectingId ? [rejectingId] : selectedCertIds;
    if (idsToReject.length === 0 || !rejectionReason.trim()) return;
    setAuthorizingBatch(true);
    try {
      await Promise.all(
        idsToReject.map((certId) =>
          fetch(`/api/certificates/${certId}/revoke`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reason: rejectionReason,
              performedBy: currentUser?.id,
              role: currentUser?.role,
            }),
          })
        )
      );
      toast({ title: 'Success', description: `Successfully rejected ${idsToReject.length} certificate(s).` });
      setShowRejectDialog(false);
      setRejectionReason('');
      setRejectingId(null);
      if (selectedPresidentEventId) {
        fetchPresidentCerts(selectedPresidentEventId);
      }
      fetchStats();
      fetchPendingCerts();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to reject some certificates.', variant: 'destructive' });
    } finally {
      setAuthorizingBatch(false);
      setSelectedCertIds([]);
    }
  };

  const handleApprove = async (certId: string) => {
    setApprovingId(certId);
    try {
      await fetch(`/api/certificates/${certId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performedBy: currentUser?.id, role: currentUser?.role }),
      });
      if (selectedPresidentEventId) {
        fetchPresidentCerts(selectedPresidentEventId);
      }
      fetchPendingCerts();
      fetchStats();
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    await handleRejectBatch();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const r = await fetch(
        `/api/certificates?search=${encodeURIComponent(searchQuery)}`
      );
      const d = await r.json();
      if (d.success) {
        setSearchResults(d.data.certificates || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeCert || !revocationReason.trim()) return;
    setRevoking(true);
    try {
      await fetch(`/api/certificates/${revokeCert.id}/revoke`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: revocationReason,
          performedBy: currentUser?.id,
          role: currentUser?.role,
        }),
      });
      setRevokeCert(null);
      setRevocationReason('');
      fetchStats();
      handleSearch();
    } catch (e) {
      console.error(e);
    } finally {
      setRevoking(false);
    }
  };

  // ─── Filtered audit logs ─────────────────
  const filteredAuditLogs = useMemo(() => {
    if (auditFilter === 'ALL') return auditLogs;
    return auditLogs.filter(
      (log) => log.action === auditFilter
    );
  }, [auditLogs, auditFilter]);

  // Stat cards are declared in the module scope above.

  // ──────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────

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
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Certificate Authority
            </h1>
            <p className="text-sm text-gray-400">
              Issue, approve, and manage digital certificates
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Issued"
          value={stats.totalIssued}
          icon={FileCheck}
          color="bg-emerald-500/10 text-emerald-400"
          delay={0.1}
          loading={statsLoading}
        />
        <StatCard
          label="Pending Approval"
          value={stats.pendingApproval}
          icon={Clock}
          color="bg-amber-500/10 text-amber-400"
          delay={0.15}
          loading={statsLoading}
        />
        <StatCard
          label="Valid"
          value={stats.valid}
          icon={CheckCircle2}
          color="bg-cyan-500/10 text-cyan-400"
          delay={0.2}
          loading={statsLoading}
        />
        <StatCard
          label="Revoked"
          value={stats.revoked}
          icon={Ban}
          color="bg-red-500/10 text-red-400"
          delay={0.25}
          loading={statsLoading}
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto p-1 gap-1">
          {isGS && (
            <TabsTrigger
              value="issue"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
            >
              <Award className="mr-1.5 h-4 w-4" />
              Issue Certificate
            </TabsTrigger>
          )}
          {isPresident && (
            <TabsTrigger
              value="pending-approval"
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
            >
              <Clock className="mr-1.5 h-4 w-4" />
              Pending Approval
              {stats.pendingApproval > 0 && (
                <Badge className="ml-1.5 h-5 min-w-5 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5">
                  {stats.pendingApproval}
                </Badge>
              )}
            </TabsTrigger>
          )}
          {(isPresident || isAdmin) && (
            <TabsTrigger
              value="revoke"
              className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
            >
              <ShieldAlert className="mr-1.5 h-4 w-4" />
              Revoke Certificate
            </TabsTrigger>
          )}
          {(isGS || isPresident || isAdmin) && (
            <TabsTrigger
              value="audit"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              <Eye className="mr-1.5 h-4 w-4" />
              Audit Trail
            </TabsTrigger>
          )}
        </TabsList>

        {/* ─── Tab 1: Issue Certificate ─────────── */}
        {isGS && (
          <TabsContent value="issue">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {/* Event selector */}
              <Card className="border-white/5 bg-[#111]/60">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Select Completed Event
                    </h3>
                  </div>

                  {eventsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full bg-white/5" />
                      <Skeleton className="h-20 w-full bg-white/5" />
                    </div>
                  ) : (
                    <>
                      <Select
                        value={selectedEventId}
                        onValueChange={setSelectedEventId}
                      >
                        <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                          <SelectValue placeholder="Choose a completed event..." />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#1a1a2e]">
                          {completedEvents.length === 0 ? (
                            <SelectItem value="__none" disabled>
                              No completed events found
                            </SelectItem>
                          ) : (
                            completedEvents.map((event) => (
                              <SelectItem
                                key={event.id}
                                value={event.id}
                                className="text-gray-300 focus:text-white focus:bg-white/10"
                              >
                                {event.title} —{' '}
                                {new Date(
                                  event.startDate
                                ).toLocaleDateString()}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {/* Certificate type and score */}
                      {selectedEventId && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                          <div className="space-y-1.5">
                            <label className="text-xs text-gray-400 font-medium">
                              Certificate Type
                            </label>
                            <Select
                              value={certType}
                              onValueChange={(v) =>
                                setCertType(v as CertificateType)
                              }
                            >
                              <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="border-white/10 bg-[#1a1a2e]">
                                {(
                                  Object.entries(CERTIFICATE_TYPE_LABELS) as [
                                    CertificateType,
                                    string,
                                  ][]
                                ).map(([value, label]) => (
                                  <SelectItem
                                    key={value}
                                    value={value}
                                    className="text-gray-300 focus:text-white focus:bg-white/10"
                                  >
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-gray-400 font-medium">
                              Score (optional)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={certScore}
                              onChange={(e) => setCertScore(e.target.value)}
                              placeholder="0-100"
                              className="border-white/10 bg-white/5 text-white placeholder:text-gray-600"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Excellence warning */}
                      {certType === 'EXCELLENCE' && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
                        >
                          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-300">
                            <strong>President Approval Required:</strong>{' '}
                            EXCELLENCE certificates require approval from the
                            President before they become valid.
                          </p>
                        </motion.div>
                      )}

                      {/* Registered Members List */}
                      {selectedEventId && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                              Registered Members
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                fetchRegistrations(selectedEventId)
                              }
                              className="h-7 text-xs text-gray-400 hover:text-emerald-400"
                            >
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Refresh
                            </Button>
                          </div>

                          {regsLoading ? (
                            <div className="space-y-2">
                              {[1, 2, 3].map((i) => (
                                <Skeleton
                                  key={i}
                                  className="h-20 w-full bg-white/5"
                                />
                              ))}
                            </div>
                          ) : registrations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-500/10 border border-white/5 mb-3">
                                <User className="h-5 w-5 text-gray-600" />
                              </div>
                              <p className="text-sm text-gray-500">
                                No registrations found for this event
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                              {registrations.map((reg, idx) => {
                                const eligibility =
                                  eligibilityMap[reg.userId];
                                const isEligible = eligibility?.eligible;
                                const isChecking =
                                  !eligibility && !!selectedEventId;
                                const isIssuing =
                                  issuingMemberId === reg.userId;

                                return (
                                  <motion.div
                                    key={reg.id}
                                    variants={item}
                                    custom={idx}
                                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {/* Eligibility indicator */}
                                      <div className="shrink-0">
                                        {isChecking ? (
                                          <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
                                        ) : isEligible ? (
                                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                        ) : isEligible === false ? (
                                          <XCircle className="h-5 w-5 text-red-400" />
                                        ) : (
                                          <div className="h-5 w-5 rounded-full bg-gray-500/20" />
                                        )}
                                      </div>

                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                          {reg.user?.name || 'Unknown User'}
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                          {reg.user?.department && (
                                            <span className="text-[10px] text-gray-500">
                                              {reg.user.department}
                                            </span>
                                          )}
                                          <Badge
                                            variant="outline"
                                            className={`text-[9px] h-4 px-1 ${
                                              reg.status === 'APPROVED'
                                                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                                : reg.status === 'PENDING'
                                                  ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                                                  : 'border-red-500/30 text-red-400 bg-red-500/10'
                                            }`}
                                          >
                                            {reg.status}
                                          </Badge>
                                        </div>
                                        {/* Eligibility detail chips */}
                                        {eligibility && !isEligible && (
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {Object.entries(
                                              eligibility.checks
                                            ).map(([key, passed]) => (
                                              <span
                                                key={key}
                                                className={`text-[9px] px-1.5 py-0.5 rounded ${
                                                  passed
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : 'bg-red-500/10 text-red-400'
                                                }`}
                                              >
                                                {key}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <Button
                                      size="sm"
                                      disabled={
                                        !isEligible || isIssuing || isChecking
                                      }
                                      onClick={() =>
                                        handleIssueCertificate(
                                          reg.userId,
                                          selectedEventId,
                                          certType,
                                          certScore
                                            ? parseFloat(certScore)
                                            : undefined
                                        )
                                      }
                                      className={`shrink-0 h-7 text-xs ${
                                        isEligible
                                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                          : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                      }`}
                                    >
                                      {isIssuing ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        'Issue'
                                      )}
                                    </Button>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}

        {/* ─── Tab 2: Pending Approval ──────────── */}
        {isPresident && (
          <TabsContent value="pending-approval">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {/* Event Selector Card */}
              <Card className="border-white/5 bg-[#111]/80 rounded-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-white">
                        Select Event to Review
                      </h3>
                      <p className="text-xs text-gray-500">
                        Choose an event to view registrations and authorize certificates
                      </p>
                    </div>
                    <div className="w-full md:w-80">
                      {eventsLoading ? (
                        <div className="h-10 w-full animate-pulse bg-white/5 rounded-sm" />
                      ) : (
                        <Select
                          value={selectedPresidentEventId}
                          onValueChange={setSelectedPresidentEventId}
                        >
                          <SelectTrigger className="border-white/10 bg-white/5 text-white rounded-sm h-10 hover:border-emerald-500/30 transition-colors">
                            <SelectValue placeholder="Choose completed/active event..." />
                          </SelectTrigger>
                          <SelectContent className="border-white/10 bg-[#0e0e1a] text-white">
                            {completedEvents.length === 0 ? (
                              <div className="py-2 px-3 text-xs text-gray-500">No events found</div>
                            ) : (
                              completedEvents.map((ev) => (
                                <SelectItem key={ev.id} value={ev.id} className="focus:bg-white/5 text-xs">
                                  {ev.title} ({ev.status.replace(/_/g, ' ')})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!selectedPresidentEventId ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/5 rounded-sm bg-[#111]/20">
                  <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-emerald-500/10 border border-emerald-500/20 mb-4 text-emerald-400">
                    <Award className="h-8 w-8" />
                  </div>
                  <h4 className="text-white font-semibold text-sm">No Event Selected</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    Please select an event from the dropdown above to review participants and approve certificates.
                  </p>
                </div>
              ) : presidentLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-20 w-full bg-white/5 rounded-sm" />
                    ))}
                  </div>
                  <Skeleton className="h-64 w-full bg-white/5 rounded-sm" />
                </div>
              ) : (
                <>
                  {/* Event Certificates Stats Panel */}
                  {presidentCerts.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="border border-white/5 bg-[#111]/40 rounded-sm px-4 py-3">
                        <p className="text-lg font-bold text-white">
                          {presidentCerts.length}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Total Registrations
                        </p>
                      </div>
                      <div className="border border-white/5 bg-[#111]/40 rounded-sm px-4 py-3">
                        <p className="text-lg font-bold text-cyan-400">
                          {presidentCerts.filter((c) => c.status === "PRESENT").length}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Attendance Confirmed
                        </p>
                      </div>
                      <div className="border border-white/5 bg-[#111]/40 rounded-sm px-4 py-3">
                        <p className="text-lg font-bold text-amber-400">
                          {presidentCerts.filter((c) => c.status === "ELIGIBLE").length}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Eligible for Award
                        </p>
                      </div>
                      <div className="border border-white/5 bg-[#111]/40 rounded-sm px-4 py-3">
                        <p className="text-lg font-bold text-emerald-400">
                          {
                            presidentCerts.filter((c) =>
                              ["AUTHORIZED", "GENERATED", "DOWNLOADED"].includes(c.status)
                            ).length
                          }
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Authorized / Issued
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions Header Bar */}
                  {presidentCerts.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border border-white/5 bg-[#111]/80 rounded-sm p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 rounded-sm text-[10px] font-bold">
                          {selectedCertIds.length} Selected
                        </div>
                        {selectedCertIds.length > 0 && (
                          <span className="text-xs text-gray-500">
                            for batch action
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Authorize Selected */}
                        <Button
                          size="sm"
                          disabled={selectedCertIds.length === 0 || authorizingBatch}
                          onClick={() => handleAuthorizeBatch(selectedCertIds)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm text-xs h-8 px-3 transition-transform hover:scale-[1.01]"
                        >
                          {authorizingBatch ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          )}
                          Authorize Selected
                        </Button>

                        {/* Authorize All Eligible */}
                        {presidentCerts.some((c) => c.status === "ELIGIBLE") && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={authorizingBatch}
                            onClick={() => {
                              const eligibleIds = presidentCerts
                                .filter((c) => c.status === "ELIGIBLE")
                                .map((c) => c.id);
                              handleAuthorizeBatch(eligibleIds);
                            }}
                            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-sm text-xs h-8 px-3"
                          >
                            <Award className="h-3.5 w-3.5 mr-1" />
                            Authorize All Eligible (
                            {presidentCerts.filter((c) => c.status === "ELIGIBLE").length})
                          </Button>
                        )}

                        {/* Reject Selected */}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={selectedCertIds.length === 0 || authorizingBatch}
                          onClick={() => {
                            setRejectingId(null); // Indicates batch reject
                            setShowRejectDialog(true);
                          }}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-sm text-xs h-8 px-3"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject Selected
                        </Button>
                      </div>
                    </div>
                  )}

                  {presidentCerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 rounded-sm bg-[#111]/40">
                      <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-white/5 border border-white/10 mb-4 text-gray-500">
                        <Award className="h-6 w-6" />
                      </div>
                      <p className="text-gray-400 font-medium text-sm">
                        No Certificates Found
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        No participant registrations match certificates for this event yet.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto w-full border border-white/5 bg-[#111]/60 rounded-sm">
                      <table className="min-w-full divide-y divide-white/5 text-left text-sm text-gray-300">
                        <thead className="bg-[#16162a]/80 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <tr>
                            <th className="p-4 w-12">
                              {presidentCerts.filter((c) =>
                                ["REGISTERED", "PRESENT", "ELIGIBLE"].includes(c.status)
                              ).length > 0 && (
                                <input
                                  type="checkbox"
                                  checked={
                                    presidentCerts
                                      .filter((c) =>
                                        ["REGISTERED", "PRESENT", "ELIGIBLE"].includes(c.status)
                                      )
                                      .every((c) => selectedCertIds.includes(c.id))
                                  }
                                  onChange={() => {
                                    const selectable = presidentCerts.filter((c) =>
                                      ["REGISTERED", "PRESENT", "ELIGIBLE"].includes(c.status)
                                    );
                                    const allSel = selectable.every((c) =>
                                      selectedCertIds.includes(c.id)
                                    );
                                    if (allSel) {
                                      setSelectedCertIds((prev) =>
                                        prev.filter(
                                          (id) => !selectable.some((c) => c.id === id)
                                        )
                                      );
                                    } else {
                                      setSelectedCertIds((prev) => {
                                        const other = prev.filter(
                                          (id) => !selectable.some((c) => c.id === id)
                                        );
                                        return [...other, ...selectable.map((c) => c.id)];
                                      });
                                    }
                                  }}
                                  className="accent-emerald-500 h-4 w-4 bg-white/5 border-white/10 cursor-pointer rounded-none"
                                />
                              )}
                            </th>
                            <th className="p-4">Participant</th>
                            <th className="p-4">Student Info</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Attendance</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {presidentCerts.map((cert) => {
                            const isSelectable = ["REGISTERED", "PRESENT", "ELIGIBLE"].includes(
                              cert.status
                            );
                            const displayName =
                              (cert as any).registration?.preferredName ||
                              cert.user?.name ||
                              "Unknown";
                            const studentId =
                              (cert as any).registration?.studentId ||
                              cert.user?.studentId ||
                              "-";
                            const dept =
                              (cert as any).registration?.department ||
                              (cert as any).registration?.institution ||
                              "";

                            return (
                              <tr
                                key={cert.id}
                                className={`hover:bg-white/5 transition-colors ${
                                  selectedCertIds.includes(cert.id) ? "bg-white/5" : ""
                                }`}
                              >
                                <td className="p-4">
                                  {isSelectable ? (
                                    <input
                                      type="checkbox"
                                      checked={selectedCertIds.includes(cert.id)}
                                      onChange={() => {
                                        setSelectedCertIds((prev) =>
                                          prev.includes(cert.id)
                                            ? prev.filter((id) => id !== cert.id)
                                            : [...prev, cert.id]
                                        );
                                      }}
                                      className="accent-emerald-500 h-4 w-4 bg-white/5 border-white/10 cursor-pointer rounded-none"
                                    />
                                  ) : (
                                    <div className="w-4 h-4 flex items-center justify-center">
                                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/40" />
                                    </div>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    {cert.user?.avatar ? (
                                      <img
                                        src={cert.user.avatar}
                                        alt={displayName}
                                        className="h-8 w-8 rounded-full border border-white/10 object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-8 w-8 items-center justify-center bg-white/5 border border-white/10 rounded-full text-xs text-gray-400 uppercase">
                                        {displayName.charAt(0)}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-white truncate">
                                        {displayName}
                                      </p>
                                      <p className="text-[10px] text-gray-500 truncate">
                                        {cert.user?.email || "No Email"}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-xs">
                                  <p className="text-white font-mono">{studentId}</p>
                                  {dept && <p className="text-[10px] text-gray-500">{dept}</p>}
                                </td>
                                <td className="p-4">
                                  <CertificateTypeBadge type={cert.type} />
                                </td>
                                <td className="p-4">
                                  <CertificateStatusBadge
                                    status={cert.status as CertificateStatus}
                                  />
                                </td>
                                <td className="p-4">
                                  {(() => {
                                    const attStatus = (cert as any).attendance?.status;
                                    if (!attStatus) {
                                      return (
                                        <Badge
                                          variant="outline"
                                          className="border-white/10 text-gray-500 text-[10px] bg-white/5 rounded-none"
                                        >
                                          Unmarked
                                        </Badge>
                                      );
                                    }
                                    if (attStatus === "PRESENT") {
                                      return (
                                        <Badge
                                          variant="outline"
                                          className="border-emerald-500/30 text-emerald-400 text-[10px] bg-emerald-500/5 rounded-none"
                                        >
                                          Present
                                        </Badge>
                                      );
                                    }
                                    if (attStatus === "LATE") {
                                      return (
                                        <Badge
                                          variant="outline"
                                          className="border-amber-500/30 text-amber-400 text-[10px] bg-amber-500/5 rounded-none"
                                        >
                                          Late
                                        </Badge>
                                      );
                                    }
                                    return (
                                      <Badge
                                        variant="outline"
                                        className="border-red-500/30 text-red-400 text-[10px] bg-red-500/5 rounded-none"
                                      >
                                        Absent
                                      </Badge>
                                    );
                                  })()}
                                </td>
                                <td className="p-4 text-right">
                                  {isSelectable ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Button
                                        size="sm"
                                        disabled={approvingId === cert.id}
                                        onClick={() => handleApprove(cert.id)}
                                        className="h-7 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-none text-[10px] font-medium"
                                      >
                                        {approvingId === cert.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          "Approve"
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={rejectingId === cert.id}
                                        onClick={() => {
                                          setRejectingId(cert.id);
                                          setShowRejectDialog(true);
                                        }}
                                        className="h-7 px-2 border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-none text-[10px] font-medium"
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  ) : cert.status === "REVOKED" ? (
                                    <span className="text-[10px] text-red-500 font-medium">
                                      Revoked
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-400 font-medium flex items-center justify-end gap-1">
                                      <CheckCircle2 className="h-3 w-3" /> Issued
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </motion.div>

            {/* Reject Dialog */}
            <Dialog
              open={showRejectDialog}
              onOpenChange={(open) => {
                setShowRejectDialog(open);
                if (!open) {
                  setRejectionReason("");
                  setRejectingId(null);
                }
              }}
            >
              <DialogContent className="border-white/10 bg-[#0e0e1a] text-white sm:max-w-md rounded-none">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-400" />
                    Reject/Revoke Certificate
                  </DialogTitle>
                  <DialogDescription className="text-gray-400 text-xs">
                    Please provide an audit reason for rejecting or revoking these certificates. This action will be logged.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection audit details..."
                  className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 min-h-[100px] rounded-none focus:border-red-500/35"
                />
                <DialogFooter className="gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowRejectDialog(false)}
                    className="text-gray-400 hover:text-white rounded-none text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={!rejectionReason.trim()}
                    onClick={handleReject}
                    className="bg-red-600 hover:bg-red-500 text-white rounded-none text-xs"
                  >
                    Confirm Rejection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}

        {/* ─── Tab 3: Revoke Certificate ────────── */}
        {(isPresident || isAdmin) && (
          <TabsContent value="revoke">
            <div className="space-y-4">
              {/* Search */}
              <Card className="border-white/5 bg-[#111]/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-4 w-4 text-red-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Search Certificate
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search by certificate code or recipient name..."
                      className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 flex-1"
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={searching}
                      className="bg-red-600 hover:bg-red-500 text-white shrink-0"
                    >
                      {searching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {searchResults.map((cert, idx) => (
                    <motion.div key={cert.id} variants={item} custom={idx}>
                      <Card
                        className={`border-white/5 bg-[#111]/60 transition-colors ${
                          cert.status === 'REVOKED'
                            ? 'opacity-60'
                            : 'hover:border-red-500/20'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-white truncate">
                                  {cert.user?.name || 'Unknown'}
                                </p>
                                <CertificateTypeBadge type={cert.type} />
                                <CertificateStatusBadge
                                  status={
                                    cert.status as CertificateStatus
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3 shrink-0" />
                                  {cert.event?.title || 'Unknown Event'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Hash className="h-3 w-3 shrink-0" />
                                  <span className="font-mono">
                                    {cert.certificateCode}
                                  </span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  Issued:{' '}
                                  {new Date(
                                    cert.issuedAt
                                  ).toLocaleDateString()}
                                </span>
                                {cert.issuer && (
                                  <span className="flex items-center gap-1.5">
                                    <User className="h-3 w-3 shrink-0" />
                                    Issued by: {cert.issuer.name}
                                  </span>
                                )}
                              </div>
                              {cert.revocationReason && (
                                <div className="mt-1.5 flex items-start gap-1.5 rounded bg-red-500/5 border border-red-500/10 p-2">
                                  <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                                  <p className="text-[11px] text-red-300">
                                    <strong>Reason:</strong>{' '}
                                    {cert.revocationReason}
                                  </p>
                                </div>
                              )}
                            </div>

                            <Button
                              size="sm"
                              disabled={cert.status === 'REVOKED'}
                              onClick={() => {
                                setRevokeCert(cert);
                                setRevocationReason('');
                              }}
                              className={`shrink-0 h-8 text-xs ${
                                cert.status === 'REVOKED'
                                  ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                  : 'bg-red-600 hover:bg-red-500 text-white'
                              }`}
                            >
                              {cert.status === 'REVOKED' ? (
                                <>
                                  <Ban className="mr-1 h-3.5 w-3.5" />
                                  Already Revoked
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                                  Revoke
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Empty search state */}
              {searchResults.length === 0 && searchQuery && !searching && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-500/10 border border-white/5 mb-3">
                    <Search className="h-5 w-5 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-500">
                    No certificates found
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Try searching by certificate code or recipient name
                  </p>
                </div>
              )}

              {/* Initial state - no search yet */}
              {searchResults.length === 0 && !searchQuery && !searching && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-amber-500/10 border border-white/5 mb-4">
                    <ShieldAlert className="h-8 w-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400 font-medium">
                    Revoke a Certificate
                  </p>
                  <p className="text-xs text-gray-600 mt-1 max-w-sm">
                    Search for a certificate by code or recipient name to view
                    details and initiate revocation
                  </p>
                </div>
              )}
            </div>

            {/* Revoke Dialog */}
            <Dialog
              open={!!revokeCert}
              onOpenChange={(open) => {
                if (!open) {
                  setRevokeCert(null);
                  setRevocationReason('');
                }
              }}
            >
              <DialogContent className="border-white/10 bg-[#1a1a2e] text-white sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-400" />
                    Revoke Certificate
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    This action cannot be undone. The certificate will be
                    permanently marked as revoked.
                  </DialogDescription>
                </DialogHeader>

                {revokeCert && (
                  <div className="space-y-3">
                    {/* Certificate details */}
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Recipient
                        </span>
                        <span className="text-xs text-white font-medium">
                          {revokeCert.user?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Event</span>
                        <span className="text-xs text-white">
                          {revokeCert.event?.title || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Type</span>
                        <CertificateTypeBadge type={revokeCert.type} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Code</span>
                        <span className="text-xs text-emerald-400 font-mono">
                          {revokeCert.certificateCode}
                        </span>
                      </div>
                    </div>

                    {/* Reason selector */}
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 font-medium">
                        Reason for Revocation <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          'Fraud detected',
                          'Cheating confirmed',
                          'Wrong issuance',
                          'Other',
                        ].map((reason) => (
                          <button
                            key={reason}
                            onClick={() =>
                              setRevocationReason(
                              revocationReason === reason
                                ? ''
                                : reason
                            )
                            }
                            className={`rounded-lg border px-3 py-2 text-xs transition-all ${
                              revocationReason === reason
                                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                : 'border-white/5 bg-white/[0.02] text-gray-400 hover:bg-white/5'
                            }`}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                      <Textarea
                        value={
                          revocationReason === 'Other' ||
                          ![
                            'Fraud detected',
                            'Cheating confirmed',
                            'Wrong issuance',
                          ].includes(revocationReason)
                            ? revocationReason === 'Other'
                              ? ''
                              : revocationReason
                            : ''
                        }
                        onChange={(e) =>
                          setRevocationReason(
                            e.target.value || 'Other'
                          )
                        }
                        placeholder="Provide additional details..."
                        className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 min-h-[80px]"
                      />
                    </div>
                  </div>
                )}

                <DialogFooter className="gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setRevokeCert(null);
                      setRevocationReason('');
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={!revocationReason.trim() || revoking}
                    onClick={handleRevoke}
                    className="bg-red-600 hover:bg-red-500 text-white"
                  >
                    {revoking ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 mr-1" />
                    )}
                    Revoke Certificate
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}

        {/* ─── Tab 4: Audit Trail ──────────────── */}
        {(isGS || isPresident || isAdmin) && (
          <TabsContent value="audit">
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-cyan-400" />
                <Select value={auditFilter} onValueChange={setAuditFilter}>
                  <SelectTrigger className="w-48 border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#1a1a2e]">
                    <SelectItem
                      value="ALL"
                      className="text-gray-300 focus:text-white focus:bg-white/10"
                    >
                      All Actions
                    </SelectItem>
                    {(
                      [
                        'ISSUED',
                        'APPROVED',
                        'REVOKED',
                        'ELIGIBILITY_CHECKED',
                      ] as CertificateAuditAction[]
                    ).map((action) => (
                      <SelectItem
                        key={action}
                        value={action}
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        {action.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAuditLogs}
                  className="text-gray-400 hover:text-cyan-400"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Audit logs list */}
              {auditLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-16 w-full bg-white/5 rounded-lg"
                    />
                  ))}
                </div>
              ) : filteredAuditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-white/5 mb-4">
                    <Eye className="h-8 w-8 text-gray-600" />
                  </div>
                  <p className="text-gray-400 font-medium">No Audit Logs</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Certificate actions will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                  <AnimatePresence>
                    {filteredAuditLogs.map((log, idx) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
                      >
                        {/* Action badge */}
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[10px] font-medium mt-0.5 ${
                            AUDIT_ACTION_COLORS[log.action] ||
                            'bg-gray-500/15 text-gray-400 border-gray-500/20'
                          }`}
                        >
                          {log.action.replace(/_/g, ' ')}
                        </Badge>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-white font-medium">
                              {log.performer?.name || 'System'}
                            </span>
                            <span className="text-[10px] text-gray-600">
                              •
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {timeAgo(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                            {log.details}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
