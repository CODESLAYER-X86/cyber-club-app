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
  Zap,
  ExternalLink,
  Undo2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { toast } from '@/hooks/use-toast';
import type {
  Certificate,
  CertificateType,
  CertificateStatus,
  CertificateAuditLog,
  CertificateAuditAction,
  Event,
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
import { Checkbox } from '@/components/ui/checkbox';

// ──────────────────────────────────────────
// Animation variants
// ──────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
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
  VIEWED: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  SHARED: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
};

// Preset reasons for revocation
const PRESET_REVOCATION_REASONS = [
  'Wrong issuance / Administrative error',
  'Attendance falsified / Absent',
  'Cheating / Disciplinary action',
  'Event criteria not met',
  'Other / Custom reason',
];

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
    className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#111]/80 px-4 py-3 shadow-sm backdrop-blur-sm"
  >
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}
    >
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-xl font-bold tracking-tight text-white">
        {loading ? <Skeleton className="h-6 w-10 bg-white/10" /> : value}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
        {label}
      </p>
    </div>
  </motion.div>
);

// ──────────────────────────────────────────
// Main Component: Option A Unified Console
// ──────────────────────────────────────────

export function CertificateAuthorityPage() {
  const { currentUser } = useAppStore();
  const role = currentUser?.role ?? 'GUEST';

  const isGS = role === 'GS';
  const isPresident = role === 'PRESIDENT';
  const isVP = role === 'VP';
  const isAdmin = role === 'PLATFORM_ADMIN';
  const canDirectAuthorize = isPresident || isVP || isAdmin;

  // Top level active tab
  const [activeTab, setActiveTab] = useState<'console' | 'search' | 'audit'>('console');

  // Global CA Stats
  const [stats, setStats] = useState({
    totalIssued: 0,
    pendingApproval: 0,
    valid: 0,
    revoked: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // ─── Event Console State ─────────────────
  const [completedEvents, setCompletedEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [eventCerts, setEventCerts] = useState<Certificate[]>([]);
  const [eventCertsLoading, setEventCertsLoading] = useState(false);

  // Status Filter in Event Console: 'ALL' | 'PENDING' | 'VALID' | 'REVOKED'
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VALID' | 'REVOKED'>('ALL');
  const [eventSearch, setEventSearch] = useState('');

  // Issuance configuration
  const [certType, setCertType] = useState<CertificateType>('PARTICIPATION');
  const [certScore, setCertScore] = useState('');

  // Selection for batch actions
  const [selectedCertIds, setSelectedCertIds] = useState<string[]>([]);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Revocation Modal state
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokingCert, setRevokingCert] = useState<Certificate | null>(null);
  const [isBatchRevoke, setIsBatchRevoke] = useState(false);
  const [selectedPresetReason, setSelectedPresetReason] = useState<string>('');
  const [revocationNotes, setRevocationNotes] = useState('');

  // Executive Override Modal state (for issuing certificates to absent attendees)
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideCert, setOverrideCert] = useState<Certificate | null>(null);

  // Preview Modal state
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

  // ─── Global Search State ─────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Certificate[]>([]);
  const [searching, setSearching] = useState(false);

  // ─── Audit Trail State ───────────────────
  const [auditLogs, setAuditLogs] = useState<CertificateAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState<string>('ALL');

  // ──────────────────────────────────────────
  // Data Fetching
  // ──────────────────────────────────────────

  // Fetch Global Stats
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
            (c) => c.status === 'ELIGIBLE' || c.status === 'PRESENT'
          ).length,
          valid: certs.filter((c) =>
            ['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(c.status)
          ).length,
          revoked: certs.filter((c) => c.status === 'REVOKED').length,
        });
      }
    } catch (e) {
      console.error('Error fetching certificate stats:', e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Events sorted chronologically (newest first)
  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const r = await fetch('/api/events');
      const d = await r.json();
      if (d.success) {
        const allEvents: Event[] = d.data.events || [];
        // Sort chronologically: newest start date (or createdAt) at the top
        const sorted = allEvents.sort((a, b) => {
          const dateA = new Date(a.startDate || a.createdAt).getTime();
          const dateB = new Date(b.startDate || b.createdAt).getTime();
          return dateB - dateA;
        });

        setCompletedEvents(sorted);

        // Pre-select the newest event if none is currently selected
        if (sorted.length > 0 && !selectedEventId) {
          setSelectedEventId(sorted[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching events:', e);
    } finally {
      setEventsLoading(false);
    }
  }, [selectedEventId]);

  // Fetch certificates for the selected event (triggers self-heal/creation on backend)
  const fetchEventCerts = useCallback(async (eventId: string) => {
    if (!eventId) return;
    setEventCertsLoading(true);
    try {
      const r = await fetch(`/api/certificates?eventId=${eventId}&t=${Date.now()}`);
      const d = await r.json();
      if (d.success) {
        setEventCerts(d.data.certificates || []);
        setSelectedCertIds([]);
      }
    } catch (e) {
      console.error('Error fetching event certificates:', e);
      toast({
        title: 'Error',
        description: 'Failed to load certificates for the selected event.',
        variant: 'destructive',
      });
    } finally {
      setEventCertsLoading(false);
    }
  }, []);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const r = await fetch('/api/certificates/audit-logs');
      const d = await r.json();
      if (d.success) {
        setAuditLogs(d.data.auditLogs || []);
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchEvents();
  }, [fetchStats, fetchEvents]);

  // When selected event changes, load its certificates
  useEffect(() => {
    if (selectedEventId) {
      fetchEventCerts(selectedEventId);
    } else {
      setEventCerts([]);
      setSelectedCertIds([]);
    }
  }, [selectedEventId, fetchEventCerts]);

  // When audit tab opened, load logs
  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchAuditLogs]);

  // ──────────────────────────────────────────
  // Derived Event Metrics & Filtering
  // ──────────────────────────────────────────

  const selectedEvent = useMemo(
    () => completedEvents.find((e) => e.id === selectedEventId),
    [completedEvents, selectedEventId]
  );

  // Status classification helper
  const isPendingEligible = useCallback((c: Certificate) => {
    if (['AUTHORIZED', 'GENERATED', 'DOWNLOADED', 'REVOKED'].includes(c.status)) {
      return false;
    }
    const attStatus = (c as any).attendance?.status;
    return attStatus === 'PRESENT' || attStatus === 'LATE' || c.status === 'ELIGIBLE' || c.status === 'PRESENT';
  }, []);

  const isValidActive = useCallback((c: Certificate) => {
    return ['AUTHORIZED', 'GENERATED', 'DOWNLOADED'].includes(c.status);
  }, []);

  const isRevokedCert = useCallback((c: Certificate) => {
    return c.status === 'REVOKED';
  }, []);

  // Event Quick Metrics
  const eventMetrics = useMemo(() => {
    const total = eventCerts.length;
    const attended = eventCerts.filter((c) => {
      const att = (c as any).attendance?.status;
      return att === 'PRESENT' || att === 'LATE';
    }).length;
    const pending = eventCerts.filter(isPendingEligible).length;
    const valid = eventCerts.filter(isValidActive).length;
    const revoked = eventCerts.filter(isRevokedCert).length;

    return { total, attended, pending, valid, revoked };
  }, [eventCerts, isPendingEligible, isValidActive, isRevokedCert]);

  // Counts of selected items by category
  const selectedPendingCount = useMemo(() => {
    return selectedCertIds.filter((id) => {
      const c = eventCerts.find((x) => x.id === id);
      return c && isPendingEligible(c);
    }).length;
  }, [selectedCertIds, eventCerts, isPendingEligible]);

  const selectedValidCount = useMemo(() => {
    return selectedCertIds.filter((id) => {
      const c = eventCerts.find((x) => x.id === id);
      return c && isValidActive(c);
    }).length;
  }, [selectedCertIds, eventCerts, isValidActive]);

  // Filtered certificates list
  const filteredCerts = useMemo(() => {
    return eventCerts.filter((c) => {
      // 1. Status Filter
      if (statusFilter === 'PENDING' && !isPendingEligible(c)) return false;
      if (statusFilter === 'VALID' && !isValidActive(c)) return false;
      if (statusFilter === 'REVOKED' && !isRevokedCert(c)) return false;

      // 2. Search Filter
      if (eventSearch.trim()) {
        const query = eventSearch.toLowerCase().trim();
        const name = c.user?.name?.toLowerCase() || '';
        const email = c.user?.email?.toLowerCase() || '';
        const code = c.certificateCode?.toLowerCase() || '';
        const studentId = ((c as any).registration?.studentId || (c as any).user?.studentId || '').toLowerCase();
        const dept = ((c as any).registration?.department || '').toLowerCase();

        return (
          name.includes(query) ||
          email.includes(query) ||
          code.includes(query) ||
          studentId.includes(query) ||
          dept.includes(query)
        );
      }

      return true;
    });
  }, [eventCerts, statusFilter, eventSearch, isPendingEligible, isValidActive, isRevokedCert]);

  // ──────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────

  // Single Issue / Authorize
  const handleIssueSingle = async (cert: Certificate) => {
    setActionInProgress(true);
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: cert.userId,
          eventId: cert.eventId,
          type: certType,
          score: certScore ? parseFloat(certScore) : cert.score,
          eligibilityVerified: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: canDirectAuthorize ? 'Certificate Authorized' : 'Certificate Issued',
          description: canDirectAuthorize
            ? `Successfully authorized active certificate for ${cert.user?.name}.`
            : `Certificate issued for ${cert.user?.name}. Pending executive approval.`,
        });
        if (selectedEventId) fetchEventCerts(selectedEventId);
        fetchStats();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to issue certificate.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Network error issuing certificate.',
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Batch Issue & Authorize Selected
  const handleBatchIssueSelected = async () => {
    const certsToIssue = eventCerts.filter(
      (c) => selectedCertIds.includes(c.id) && isPendingEligible(c)
    );

    if (certsToIssue.length === 0) {
      toast({
        title: 'No eligible recipients',
        description: 'Please select pending or eligible participants to issue.',
      });
      return;
    }

    setActionInProgress(true);
    try {
      const payload = {
        items: certsToIssue.map((c) => ({
          userId: c.userId,
          eventId: c.eventId,
          type: certType,
          score: certScore ? parseFloat(certScore) : c.score,
          eligibilityVerified: true,
        })),
      };

      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Batch Issuance Successful',
          description: `Successfully authorized ${certsToIssue.length} certificate(s).`,
        });
        setSelectedCertIds([]);
        if (selectedEventId) fetchEventCerts(selectedEventId);
        fetchStats();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Batch issuance failed.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Failed to process batch issuance.',
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Issue All Pending / Eligible
  const handleIssueAllEligible = async () => {
    const allPending = eventCerts.filter(isPendingEligible);
    if (allPending.length === 0) {
      toast({
        title: 'No pending participants',
        description: 'There are no pending eligible participants to issue.',
      });
      return;
    }

    setActionInProgress(true);
    try {
      const payload = {
        items: allPending.map((c) => ({
          userId: c.userId,
          eventId: c.eventId,
          type: certType,
          score: certScore ? parseFloat(certScore) : c.score,
          eligibilityVerified: true,
        })),
      };

      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Issued All Eligible',
          description: `Successfully authorized all ${allPending.length} eligible certificate(s).`,
        });
        setSelectedCertIds([]);
        if (selectedEventId) fetchEventCerts(selectedEventId);
        fetchStats();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to issue certificates.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Failed to issue all eligible certificates.',
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Open Revoke Modal for single certificate
  const openSingleRevokeDialog = (cert: Certificate) => {
    setRevokingCert(cert);
    setIsBatchRevoke(false);
    setSelectedPresetReason(PRESET_REVOCATION_REASONS[0]);
    setRevocationNotes('');
    setShowRevokeDialog(true);
  };

  // Open Revoke Modal for batch selection
  const openBatchRevokeDialog = () => {
    const validSelected = eventCerts.filter(
      (c) => selectedCertIds.includes(c.id) && isValidActive(c)
    );

    if (validSelected.length === 0) {
      toast({
        title: 'No active certificates selected',
        description: 'Select at least one active certificate to revoke.',
      });
      return;
    }

    setIsBatchRevoke(true);
    setRevokingCert(null);
    setSelectedPresetReason(PRESET_REVOCATION_REASONS[0]);
    setRevocationNotes('');
    setShowRevokeDialog(true);
  };

  // Confirm Revocation Execution
  const handleConfirmRevoke = async () => {
    const finalReason = selectedPresetReason === 'Other / Custom reason'
      ? revocationNotes.trim()
      : revocationNotes.trim()
      ? `${selectedPresetReason}: ${revocationNotes.trim()}`
      : selectedPresetReason;

    if (!finalReason) {
      toast({
        title: 'Reason required',
        description: 'Please select or provide a reason for revocation.',
        variant: 'destructive',
      });
      return;
    }

    setActionInProgress(true);
    try {
      if (isBatchRevoke) {
        const certsToRevoke = eventCerts.filter(
          (c) => selectedCertIds.includes(c.id) && isValidActive(c)
        );

        await Promise.all(
          certsToRevoke.map((c) =>
            fetch(`/api/certificates/${c.id}/revoke`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: finalReason }),
            })
          )
        );

        toast({
          title: 'Certificates Revoked',
          description: `Successfully revoked ${certsToRevoke.length} certificate(s).`,
        });
        setSelectedCertIds([]);
      } else if (revokingCert) {
        const res = await fetch(`/api/certificates/${revokingCert.id}/revoke`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: finalReason }),
        });

        const data = await res.json();
        if (data.success) {
          toast({
            title: 'Certificate Revoked',
            description: `Revoked certificate ${revokingCert.certificateCode} for ${revokingCert.user?.name}.`,
          });
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to revoke certificate.',
            variant: 'destructive',
          });
        }
      }

      setShowRevokeDialog(false);
      setRevokingCert(null);
      if (selectedEventId) fetchEventCerts(selectedEventId);
      fetchStats();
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Failed to process revocation.',
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Re-issue / Reinstate Revoked Certificate
  const handleReinstateRevoked = async (cert: Certificate) => {
    setActionInProgress(true);
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: cert.userId,
          eventId: cert.eventId,
          type: cert.type || 'PARTICIPATION',
          score: cert.score,
          eligibilityVerified: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Certificate Re-issued',
          description: `Successfully reinstated and authorized certificate for ${cert.user?.name}.`,
        });
        if (selectedEventId) fetchEventCerts(selectedEventId);
        fetchStats();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to reinstate certificate.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Failed to re-issue certificate.',
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Executive Override Issue (for absent members)
  const handleConfirmOverrideIssue = async () => {
    if (!overrideCert) return;
    setActionInProgress(true);
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: overrideCert.userId,
          eventId: overrideCert.eventId,
          type: certType,
          score: certScore ? parseFloat(certScore) : overrideCert.score,
          eligibilityVerified: true,
          eligibilityDetails: { executiveOverride: true, authorizedBy: currentUser?.name },
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Executive Override Granted',
          description: `Authorized certificate for ${overrideCert.user?.name} despite absent status.`,
        });
        setShowOverrideDialog(false);
        setOverrideCert(null);
        if (selectedEventId) fetchEventCerts(selectedEventId);
        fetchStats();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to issue certificate.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Failed to process override issuance.',
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Global Cross-Event Search
  const handleGlobalSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/certificates?search=${encodeURIComponent(searchQuery.trim())}&t=${Date.now()}`
      );
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data.certificates || []);
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Failed to search certificates.',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  // Selection toggle helper
  const toggleSelectAll = () => {
    if (selectedCertIds.length === filteredCerts.length && filteredCerts.length > 0) {
      setSelectedCertIds([]);
    } else {
      setSelectedCertIds(filteredCerts.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedCertIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header Banner ──────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-gradient-to-r from-emerald-950/40 via-zinc-900/60 to-cyan-950/30 p-6 backdrop-blur-md">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Certificate Authority
              </h1>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-mono tracking-wider ml-1"
              >
                {role.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 max-w-xl">
              Unified console to review event attendees, issue authorized digital credentials, and manage revocation with full audit compliance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchStats();
                if (selectedEventId) fetchEventCerts(selectedEventId);
              }}
              className="border-white/10 bg-white/5 text-xs text-zinc-300 hover:text-white hover:bg-white/10 h-8"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Global Stats Bar ───────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Records"
          value={stats.totalIssued}
          icon={FileCheck}
          color="bg-emerald-500/10 text-emerald-400"
          delay={0.05}
          loading={statsLoading}
        />
        <StatCard
          label="Pending / Ready"
          value={stats.pendingApproval}
          icon={Clock}
          color="bg-amber-500/10 text-amber-400"
          delay={0.1}
          loading={statsLoading}
        />
        <StatCard
          label="Active & Valid"
          value={stats.valid}
          icon={CheckCircle2}
          color="bg-cyan-500/10 text-cyan-400"
          delay={0.15}
          loading={statsLoading}
        />
        <StatCard
          label="Revoked"
          value={stats.revoked}
          icon={Ban}
          color="bg-red-500/10 text-red-400"
          delay={0.2}
          loading={statsLoading}
        />
      </div>

      {/* ─── Top-Level Navigation Tabs ──────────── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'console' | 'search' | 'audit')}
      >
        <TabsList className="border border-white/10 bg-[#111] p-1 rounded-xl">
          <TabsTrigger
            value="console"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs text-zinc-400 rounded-lg px-4 py-1.5 transition-all"
          >
            <Award className="mr-1.5 h-3.5 w-3.5" />
            Event Console
          </TabsTrigger>
          <TabsTrigger
            value="search"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-xs text-zinc-400 rounded-lg px-4 py-1.5 transition-all"
          >
            <Search className="mr-1.5 h-3.5 w-3.5" />
            Global Certificate Lookup
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-xs text-zinc-400 rounded-lg px-4 py-1.5 transition-all"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════ */}
        {/* TAB 1: UNIFIED EVENT CERTIFICATE CONSOLE   */}
        {/* ══════════════════════════════════════════ */}
        <TabsContent value="console" className="space-y-4 mt-4">
          {/* Event Picker Card */}
          <Card className="border-white/5 bg-[#111]/80 backdrop-blur-md rounded-xl">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Select Event to Manage
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Events are ordered chronologically (newest at the top). Choose an event to issue, authorize, or revoke certificates.
                  </p>
                </div>

                <div className="w-full md:w-[420px]">
                  {eventsLoading ? (
                    <Skeleton className="h-11 w-full bg-white/5 rounded-lg" />
                  ) : (
                    <Select
                      value={selectedEventId}
                      onValueChange={setSelectedEventId}
                    >
                      <SelectTrigger className="border-white/10 bg-white/5 text-white rounded-lg h-11 px-3 text-xs hover:border-emerald-500/40 transition-colors">
                        <SelectValue placeholder="Choose completed/active event..." />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#12121a] text-white max-h-72">
                        {completedEvents.length === 0 ? (
                          <div className="py-2 px-3 text-xs text-zinc-500">
                            No events found
                          </div>
                        ) : (
                          completedEvents.map((ev) => (
                            <SelectItem
                              key={ev.id}
                              value={ev.id}
                              textValue={`${ev.title} • ${new Date(ev.startDate).toLocaleDateString()}`}
                              className="focus:bg-white/10 text-xs py-2.5 text-zinc-200 cursor-pointer"
                            >
                              <div className="flex items-center justify-between gap-3 w-full">
                                <span className="font-medium text-white truncate">
                                  {ev.title}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] py-0 px-1 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-normal"
                                  >
                                    {ev.category}
                                  </Badge>
                                  <span className="text-[10px] text-zinc-400 font-mono">
                                    {new Date(ev.startDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Event Metadata Banner if selected */}
              {selectedEvent && (
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-[10px]"
                    >
                      {selectedEvent.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-zinc-500/20 bg-zinc-500/10 text-zinc-300 text-[10px]"
                    >
                      STATUS: {selectedEvent.status}
                    </Badge>
                    {selectedEvent.requiresAssessment && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/20 bg-amber-500/10 text-amber-300 text-[10px]"
                      >
                        Pass Mark: {selectedEvent.passingScore ?? 60}%
                      </Badge>
                    )}
                  </div>

                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    <span>
                      {new Date(selectedEvent.startDate).toLocaleDateString()} — {new Date(selectedEvent.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* If No Event Selected */}
          {!selectedEventId ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/5 rounded-xl bg-[#111]/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-3 text-emerald-400">
                <Award className="h-7 w-7" />
              </div>
              <h4 className="text-white font-semibold text-sm">No Event Selected</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Select an event from the dropdown above to view attendees and manage certificates.
              </p>
            </div>
          ) : eventCertsLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-72 w-full bg-white/5 rounded-xl" />
            </div>
          ) : (
            <>
              {/* Event Quick Metrics Pill Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <div className="border border-white/5 bg-[#111]/60 rounded-xl px-3.5 py-2.5">
                  <p className="text-base font-bold text-white">
                    {eventMetrics.total}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                    Total Registrations
                  </p>
                </div>
                <div className="border border-white/5 bg-[#111]/60 rounded-xl px-3.5 py-2.5">
                  <p className="text-base font-bold text-cyan-400">
                    {eventMetrics.attended}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                    Attended Event
                  </p>
                </div>
                <div className="border border-white/5 bg-[#111]/60 rounded-xl px-3.5 py-2.5">
                  <p className="text-base font-bold text-amber-400">
                    {eventMetrics.pending}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                    Ready to Issue
                  </p>
                </div>
                <div className="border border-white/5 bg-[#111]/60 rounded-xl px-3.5 py-2.5">
                  <p className="text-base font-bold text-emerald-400">
                    {eventMetrics.valid}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                    Active / Valid
                  </p>
                </div>
                <div className="border border-white/5 bg-[#111]/60 rounded-xl px-3.5 py-2.5 col-span-2 sm:col-span-1">
                  <p className="text-base font-bold text-red-400">
                    {eventMetrics.revoked}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                    Revoked
                  </p>
                </div>
              </div>

              {/* Console Toolbar & Configuration */}
              <Card className="border-white/5 bg-[#111]/80 rounded-xl">
                <CardContent className="p-4 space-y-4">
                  {/* Issuance Configuration Controls */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-white/5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 font-medium">
                          Issue Type:
                        </span>
                        <Select
                          value={certType}
                          onValueChange={(v) => setCertType(v as CertificateType)}
                        >
                          <SelectTrigger className="w-44 border-white/10 bg-white/5 text-xs text-white h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-white/10 bg-[#12121a]">
                            {(
                              Object.entries(CERTIFICATE_TYPE_LABELS) as [
                                CertificateType,
                                string,
                              ][]
                            ).map(([val, label]) => (
                              <SelectItem
                                key={val}
                                value={val}
                                className="text-xs text-zinc-300 focus:text-white focus:bg-white/10"
                              >
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 font-medium">
                          Score (opt):
                        </span>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={certScore}
                          onChange={(e) => setCertScore(e.target.value)}
                          placeholder="e.g. 95"
                          className="w-20 border-white/10 bg-white/5 text-xs text-white h-8"
                        />
                      </div>
                    </div>

                    {/* Batch Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        disabled={actionInProgress || selectedPendingCount === 0}
                        onClick={handleBatchIssueSelected}
                        className={`text-xs h-8 shadow-sm transition-all ${
                          selectedPendingCount > 0
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-950/40'
                            : 'bg-zinc-800/40 text-zinc-500 border border-white/5 cursor-not-allowed opacity-50'
                        }`}
                      >
                        {actionInProgress ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Zap className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {selectedPendingCount > 0
                          ? `Issue Selected (${selectedPendingCount})`
                          : 'Issue Selected'}
                      </Button>

                      {eventMetrics.pending > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionInProgress}
                          onClick={handleIssueAllEligible}
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs h-8 cursor-pointer"
                        >
                          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                          Issue All Eligible ({eventMetrics.pending})
                        </Button>
                      )}

                      {canDirectAuthorize && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionInProgress || selectedValidCount === 0}
                          onClick={openBatchRevokeDialog}
                          className={`text-xs h-8 transition-all ${
                            selectedValidCount > 0
                              ? 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer'
                              : 'border-white/5 bg-zinc-800/40 text-zinc-500 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                          {selectedValidCount > 0
                            ? `Revoke Selected (${selectedValidCount})`
                            : 'Revoke Selected'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filter Tabs & Search Filter */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5 overflow-x-auto">
                      <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                          statusFilter === 'ALL'
                            ? 'bg-white/10 text-white shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        All ({eventMetrics.total})
                      </button>
                      <button
                        onClick={() => setStatusFilter('PENDING')}
                        className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                          statusFilter === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300 shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Ready to Issue ({eventMetrics.pending})
                      </button>
                      <button
                        onClick={() => setStatusFilter('VALID')}
                        className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                          statusFilter === 'VALID'
                            ? 'bg-emerald-500/20 text-emerald-300 shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Active / Valid ({eventMetrics.valid})
                      </button>
                      <button
                        onClick={() => setStatusFilter('REVOKED')}
                        className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                          statusFilter === 'REVOKED'
                            ? 'bg-red-500/20 text-red-300 shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Revoked ({eventMetrics.revoked})
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                        <Input
                          placeholder="Filter attendee, ID, code..."
                          value={eventSearch}
                          onChange={(e) => setEventSearch(e.target.value)}
                          className="pl-8 h-8 text-xs border-white/10 bg-white/5 text-white placeholder:text-zinc-600"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participant / Certificate Rows */}
              <div className="space-y-2">
                {/* Table Header / Selection Bar */}
                <div className="flex items-center justify-between px-3.5 py-2 text-xs text-zinc-400 font-medium bg-black/20 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center shrink-0 w-4 h-4">
                      <Checkbox
                        checked={
                          filteredCerts.length > 0 &&
                          selectedCertIds.length === filteredCerts.length
                        }
                        onCheckedChange={toggleSelectAll}
                        className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                    </div>
                    <span>Select All in Filter ({filteredCerts.length})</span>
                  </div>
                  <div className="text-right text-[11px] text-zinc-500">
                    {selectedCertIds.length > 0 ? (
                      <span className="text-emerald-400 font-medium">
                        {selectedCertIds.length} of {filteredCerts.length} selected
                      </span>
                    ) : (
                      <span>Status & Actions</span>
                    )}
                  </div>
                </div>

                {filteredCerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/5 rounded-xl bg-[#111]/30">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/60 border border-white/5 mb-3 text-zinc-500">
                      <User className="h-6 w-6" />
                    </div>
                    <p className="text-sm text-zinc-300 font-medium">
                      {statusFilter === 'PENDING'
                        ? 'No Pending Certificates'
                        : statusFilter === 'VALID'
                        ? 'No Active Certificates Yet'
                        : statusFilter === 'REVOKED'
                        ? 'No Revoked Certificates'
                        : 'No Recipients Found'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                      {statusFilter === 'PENDING'
                        ? 'All eligible participants for this event have already been issued certificates, or remaining attendees were marked absent.'
                        : statusFilter === 'VALID'
                        ? 'No certificates have been issued yet. Switch to "Ready to Issue" to authorize participants.'
                        : statusFilter === 'REVOKED'
                        ? 'No certificates have been revoked for this event.'
                        : eventSearch
                        ? 'No records matched your search filter.'
                        : 'No registrations found for this event.'}
                    </p>
                    {statusFilter !== 'ALL' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStatusFilter('ALL')}
                        className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-7"
                      >
                        View All Attendees ({eventMetrics.total})
                      </Button>
                    )}
                  </div>
                ) : (
                  <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-2"
                  >
                    {filteredCerts.map((cert) => {
                      const isPending = isPendingEligible(cert);
                      const isValid = isValidActive(cert);
                      const isRevoked = isRevokedCert(cert);
                      const isSelected = selectedCertIds.includes(cert.id);
                      const att = (cert as any).attendance?.status;
                      const studentId =
                        (cert as any).registration?.studentId ||
                        (cert as any).user?.studentId ||
                        '';
                      const dept =
                        (cert as any).registration?.department ||
                        (cert as any).user?.department ||
                        '';

                      return (
                        <motion.div
                          key={cert.id}
                          variants={item}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'border-emerald-500/40 bg-emerald-950/20'
                              : 'border-white/5 bg-[#111]/70 hover:border-white/10 hover:bg-[#141414]'
                          }`}
                        >
                          {/* Left: Checkbox + User Info */}
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex items-center justify-center shrink-0 w-4 h-4 mt-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelectOne(cert.id)}
                                className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-white truncate">
                                  {(cert as any).registration?.preferredName ||
                                    cert.user?.name ||
                                    'Unknown Participant'}
                                </span>

                                {isValid && (
                                  <>
                                    <CertificateTypeBadge type={cert.type} />
                                    <Badge
                                      variant="outline"
                                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] h-4.5 px-1.5 font-medium"
                                    >
                                      ● ACTIVE
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="border-white/10 bg-white/5 text-emerald-400 text-[10px] h-4.5 px-1.5 font-mono"
                                    >
                                      {cert.certificateCode}
                                    </Badge>
                                  </>
                                )}

                                {isPending && (
                                  <Badge
                                    variant="outline"
                                    className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] h-4.5 px-1.5 font-medium"
                                  >
                                    ● READY TO ISSUE
                                  </Badge>
                                )}

                                {isRevoked && (
                                  <>
                                    <CertificateTypeBadge type={cert.type} />
                                    <Badge
                                      variant="outline"
                                      className="border-red-500/30 bg-red-500/10 text-red-400 text-[10px] h-4.5 px-1.5 font-medium"
                                    >
                                      ● REVOKED
                                    </Badge>
                                  </>
                                )}

                                {!isValid && !isPending && !isRevoked && (
                                  <Badge
                                    variant="outline"
                                    className="border-zinc-700/80 bg-zinc-800/80 text-zinc-400 text-[10px] h-4.5 px-1.5 font-medium"
                                  >
                                    ● INELIGIBLE (ABSENT)
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400 mt-1">
                                {cert.user?.email && (
                                  <span className="text-zinc-500 truncate">
                                    {cert.user.email}
                                  </span>
                                )}
                                {studentId && (
                                  <>
                                    <span className="text-zinc-600">•</span>
                                    <span className="text-zinc-400 font-mono text-[11px]">
                                      ID: {studentId}
                                    </span>
                                  </>
                                )}
                                {dept && (
                                  <>
                                    <span className="text-zinc-600">•</span>
                                    <span className="text-zinc-400 text-[11px]">
                                      {dept}
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Attendance & Issue Meta Chips */}
                              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                    att === 'PRESENT'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : att === 'LATE'
                                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                      : 'bg-zinc-800/80 text-zinc-400 border border-white/5'
                                  }`}
                                >
                                  Attendance: {att || 'Not Marked'}
                                </span>

                                {isValid && cert.issuedAt && (
                                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                                  </span>
                                )}

                                {isRevoked && cert.revocationReason && (
                                  <span className="text-[10px] text-red-300 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                                    <AlertTriangle className="h-3 w-3 text-red-400" />
                                    Reason: {cert.revocationReason}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {isPending && (
                              <Button
                                size="sm"
                                disabled={actionInProgress}
                                onClick={() => handleIssueSingle(cert)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-3 shadow-xs cursor-pointer"
                              >
                                <Zap className="mr-1 h-3 w-3" />
                                {canDirectAuthorize ? 'Issue & Authorize' : 'Issue'}
                              </Button>
                            )}

                            {isValid && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setPreviewCert(cert)}
                                  className="text-zinc-300 hover:text-white hover:bg-white/10 text-xs h-7 px-2.5 cursor-pointer"
                                >
                                  <Eye className="mr-1 h-3.5 w-3.5 text-cyan-400" />
                                  Preview
                                </Button>

                                {canDirectAuthorize && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={actionInProgress}
                                    onClick={() => openSingleRevokeDialog(cert)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7 px-2.5 cursor-pointer"
                                  >
                                    <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                                    Revoke
                                  </Button>
                                )}
                              </>
                            )}

                            {isRevoked && canDirectAuthorize && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actionInProgress}
                                onClick={() => handleReinstateRevoked(cert)}
                                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs h-7 px-2.5 cursor-pointer"
                              >
                                <Undo2 className="mr-1 h-3.5 w-3.5" />
                                Re-issue
                              </Button>
                            )}

                            {!isPending && !isValid && !isRevoked && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500 italic hidden sm:inline">
                                  Absent
                                </span>
                                {canDirectAuthorize && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actionInProgress}
                                    onClick={() => {
                                      setOverrideCert(cert);
                                      setShowOverrideDialog(true);
                                    }}
                                    className="border-zinc-700 bg-zinc-800/40 text-zinc-300 hover:text-white hover:bg-zinc-700 text-xs h-7 px-2.5 cursor-pointer"
                                  >
                                    <Zap className="mr-1 h-3 w-3 text-amber-400" />
                                    Override & Issue
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════ */}
        {/* TAB 2: GLOBAL CERTIFICATE SEARCH & LOOKUP  */}
        {/* ══════════════════════════════════════════ */}
        <TabsContent value="search" className="space-y-4 mt-4">
          <Card className="border-white/5 bg-[#111]/80 rounded-xl">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Search className="h-4 w-4 text-cyan-400" />
                  Cross-Event Certificate Search
                </h3>
                <p className="text-xs text-zinc-400">
                  Search across all historical events by certificate code, recipient name, or student ID.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                  placeholder="e.g. CSC-2026-WORKSHOP-XXXX or Member Name..."
                  className="border-white/10 bg-white/5 text-white placeholder:text-zinc-600 flex-1"
                />
                <Button
                  onClick={handleGlobalSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white shrink-0 px-4 cursor-pointer"
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="mr-1.5 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {searchResults.length > 0 && (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-2.5"
            >
              {searchResults.map((cert) => (
                <Card
                  key={cert.id}
                  className="border-white/5 bg-[#111]/70 hover:border-white/10 transition-colors rounded-xl"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-white">
                            {cert.user?.name || 'Unknown'}
                          </span>
                          <CertificateTypeBadge type={cert.type} />
                          <CertificateStatusBadge
                            status={cert.status as CertificateStatus}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                            {cert.event?.title || 'Unknown Event'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Hash className="h-3.5 w-3.5 text-zinc-500" />
                            <span className="font-mono text-emerald-400">
                              {cert.certificateCode}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-zinc-500" />
                            {new Date(cert.issuedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {cert.revocationReason && (
                          <div className="mt-1 flex items-start gap-1.5 rounded-md bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-300">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                            <span>Reason: {cert.revocationReason}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewCert(cert)}
                          className="text-zinc-300 hover:text-white hover:bg-white/10 text-xs h-8 cursor-pointer"
                        >
                          <Eye className="mr-1 h-3.5 w-3.5 text-cyan-400" />
                          Preview
                        </Button>

                        {canDirectAuthorize && cert.status !== 'REVOKED' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openSingleRevokeDialog(cert)}
                            className="bg-red-600 hover:bg-red-500 text-white text-xs h-8 cursor-pointer"
                          >
                            <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}

          {searchResults.length === 0 && searchQuery && !searching && (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/5 rounded-xl bg-[#111]/30">
              <Search className="h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-400 font-medium">No certificates found</p>
              <p className="text-xs text-zinc-600 mt-1">
                Check the certificate code or recipient name and try again
              </p>
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════ */}
        {/* TAB 3: AUDIT TRAIL LOGS                    */}
        {/* ══════════════════════════════════════════ */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400" />
              <Select value={auditFilter} onValueChange={setAuditFilter}>
                <SelectTrigger className="w-44 border-white/10 bg-white/5 text-xs text-white h-8">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#12121a]">
                  <SelectItem value="ALL" className="text-xs text-zinc-300 focus:text-white focus:bg-white/10">
                    All Actions
                  </SelectItem>
                  {['ISSUED', 'APPROVED', 'REVOKED', 'ELIGIBILITY_CHECKED'].map(
                    (act) => (
                      <SelectItem
                        key={act}
                        value={act}
                        className="text-xs text-zinc-300 focus:text-white focus:bg-white/10"
                      >
                        {act.replace(/_/g, ' ')}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAuditLogs}
              className="text-zinc-400 hover:text-white text-xs h-8 cursor-pointer"
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              Refresh Logs
            </Button>
          </div>

          {auditLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-xl" />
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/5 rounded-xl bg-[#111]/30">
              <Eye className="h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-400 font-medium">No Audit Logs</p>
              <p className="text-xs text-zinc-600 mt-1">
                Certificate actions will be recorded here
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence>
                {auditLogs
                  .filter((l) => auditFilter === 'ALL' || l.action === auditFilter)
                  .map((log, idx) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.02 * idx }}
                      className="flex items-start gap-3 rounded-xl border border-white/5 bg-[#111]/60 p-3 hover:bg-[#141414] transition-colors"
                    >
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-[10px] font-medium mt-0.5 ${
                          AUDIT_ACTION_COLORS[log.action] ||
                          'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'
                        }`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </Badge>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-white font-medium">
                            {log.performer?.name || 'Executive Authority'}
                          </span>
                          <span className="text-[10px] text-zinc-600">•</span>
                          <span className="text-[10px] text-zinc-400">
                            {timeAgo(log.createdAt)}
                          </span>
                          {log.certificate?.certificateCode && (
                            <>
                              <span className="text-[10px] text-zinc-600">•</span>
                              <span className="text-[10px] text-emerald-400 font-mono">
                                {log.certificate.certificateCode}
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                          {log.details}
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ────────────────────────────────────────── */}
      {/* MODAL 1: REVOCATION DIALOG WITH PRESETS    */}
      {/* ────────────────────────────────────────── */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent className="border-red-500/20 bg-[#14141c] text-white sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle>Confirm Certificate Revocation</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-400">
              {isBatchRevoke
                ? `You are revoking ${selectedValidCount} selected active certificate(s). This will mark them officially invalid on public verification.`
                : `You are revoking the certificate for ${
                    revokingCert?.user?.name || 'this participant'
                  } (${revokingCert?.certificateCode}).`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Select Reason for Revocation <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {PRESET_REVOCATION_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedPresetReason(reason)}
                    className={`text-left px-3 py-2 rounded-lg text-xs border transition-all ${
                      selectedPresetReason === reason
                        ? 'border-red-500/50 bg-red-500/15 text-red-200 font-medium'
                        : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:bg-white/5'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Additional Details or Notes
              </label>
              <Textarea
                value={revocationNotes}
                onChange={(e) => setRevocationNotes(e.target.value)}
                placeholder="Provide context or explanation for compliance logs..."
                className="border-white/10 bg-white/5 text-xs text-white placeholder:text-zinc-600 min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowRevokeDialog(false)}
              className="text-zinc-400 hover:text-white text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              disabled={
                actionInProgress ||
                (!selectedPresetReason && !revocationNotes.trim())
              }
              onClick={handleConfirmRevoke}
              className="bg-red-600 hover:bg-red-500 text-white text-xs h-8 cursor-pointer"
            >
              {actionInProgress ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Ban className="mr-1.5 h-3.5 w-3.5" />
              )}
              Confirm Revocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────── */}
      {/* MODAL 2: CERTIFICATE PREVIEW DIALOG        */}
      {/* ────────────────────────────────────────── */}
      <Dialog open={!!previewCert} onOpenChange={() => setPreviewCert(null)}>
        <DialogContent className="border-white/10 bg-[#0e0e14] text-white sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-400" />
                Certificate Preview: {previewCert?.certificateCode}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-400">
              Recipient: {previewCert?.user?.name} — {previewCert?.event?.title}
            </DialogDescription>
          </DialogHeader>

          {previewCert && (
            <div className="space-y-4 py-2">
              <div className="aspect-[16/11] w-full rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center relative">
                <img
                  src={`/api/certificates/${previewCert.certificateCode}/og`}
                  alt="Certificate Preview"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-mono">
                  Code: {previewCert.certificateCode}
                </span>
                <a
                  href={`/verify/${previewCert.certificateCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                >
                  Open Public Verification Page
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewCert(null)}
              className="border-white/10 bg-white/5 text-xs text-white cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────── */}
      {/* MODAL 3: EXECUTIVE OVERRIDE CONFIRMATION   */}
      {/* ────────────────────────────────────────── */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent className="border-amber-500/20 bg-[#14141c] text-white sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-400">
              <Zap className="h-5 w-5" />
              <DialogTitle>Grant Executive Override</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-400">
              Participant <strong className="text-white">{overrideCert?.user?.name}</strong> was marked <strong className="text-red-400">ABSENT</strong> for this event.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-zinc-300">
            <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-1.5">
              <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Presidential Exemption Notice
              </p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                As President or Platform Admin, issuing this certificate will bypass the absence disqualification and immediately grant an active, verified certificate. This action will be recorded in the audit trail.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setShowOverrideDialog(false);
                setOverrideCert(null);
              }}
              className="text-zinc-400 hover:text-white text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              disabled={actionInProgress}
              onClick={handleConfirmOverrideIssue}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-8 cursor-pointer"
            >
              {actionInProgress ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="mr-1.5 h-3.5 w-3.5" />
              )}
              Confirm Override & Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
