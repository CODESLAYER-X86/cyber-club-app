'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  Award,
  CreditCard,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  Shield,
  Settings,
  Activity,
  TrendingUp,
  Bell,
  Info,
  Clock,
  UserCheck,
  Wallet,
  ShieldCheck,
  Ban,
  Receipt,
  Megaphone,
  Plus,
  ArrowUpRight,
  Sparkles,
  Camera,
  Globe,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { UserRole, Event, Payment, Certificate, User as UserType } from '@/types';
import { ROLE_LABELS } from '@/types';
import { StatCard } from '@/components/shared/stat-card';
import { EventBadge, MembershipBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalMembers: number;
  totalFunds: number;
  activeEvents: number;
  pendingApprovals: number;
  recentActivity: { action: string; details: string; createdAt: string }[];
  upcomingEvents: Event[];
}

interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user?: { name: string; email: string };
}

const ACTION_CONFIG: Record<string, { icon: typeof Activity; color: string; label: string }> = {
  PAYMENT_VERIFIED: { icon: Wallet, color: '#10b981', label: 'Payment Verified' },
  EXPENSE_APPROVED: { icon: Receipt, color: '#10b981', label: 'Expense Approved' },
  ROLE_ASSIGNED: { icon: ShieldCheck, color: '#f59e0b', label: 'Role Assigned' },
  BUDGET_CREATED: { icon: DollarSign, color: '#06b6d4', label: 'Deposit Created' },
  PAYMENT_REJECTED: { icon: Ban, color: '#ef4444', label: 'Payment Rejected' },
  EXPENSE_REJECTED: { icon: Ban, color: '#ef4444', label: 'Expense Rejected' },
  USER_APPROVED: { icon: UserCheck, color: '#10b981', label: 'User Approved' },
  USER_REJECTED: { icon: Ban, color: '#ef4444', label: 'User Rejected' },
  ANNOUNCEMENT_CREATED: { icon: Megaphone, color: '#8b5cf6', label: 'Announcement Created' },
  EVENT_CREATED: { icon: Calendar, color: '#06b6d4', label: 'Event Created' },
};

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const EVENT_CATEGORY_COLORS: Record<string, string> = {
  WORKSHOP: '#10b981',
  CTF: '#06b6d4',
  SEMINAR: '#f59e0b',
  MEETUP: '#8b5cf6',
  TRAINING: '#ef4444',
};

export function DashboardPage() {
  const { currentUser, setCurrentView, setSelectedEventId } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserType[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const fetchPromises: Promise<any>[] = [
          fetch('/api/stats').then((res) => res.json()),
          fetch('/api/audit-logs?limit=5').then((res) => res.json()),
        ];

        if (currentUser) {
          fetchPromises.push(
            fetch(`/api/certificates?userId=${currentUser.id}`).then((res) => res.json())
          );
          fetchPromises.push(
            fetch(`/api/payments?userId=${currentUser.id}`).then((res) => res.json())
          );

          if (['PRESIDENT', 'GS', 'PLATFORM_ADMIN'].includes(currentUser.role)) {
            fetchPromises.push(fetch('/api/users/approval').then((res) => res.json()));
          }
        }

        const results = await Promise.all(fetchPromises);

        const statsData = results[0];
        if (statsData?.success && statsData.data) {
          const d = statsData.data;
          const s = d.stats || d;
          setStats({
            totalMembers: s.totalMembers ?? 0,
            totalFunds: s.totalFunds ?? 0,
            activeEvents: s.activeEvents ?? 0,
            pendingApprovals: s.pendingApprovals ?? 0,
            recentActivity: d.recentActivity || [],
            upcomingEvents: d.upcomingEvents || [],
          });
        }

        const auditData = results[1];
        if (auditData?.success && Array.isArray(auditData.data)) {
          setAuditLogs(auditData.data);
        }

        if (currentUser) {
          const certData = results[2];
          if (certData?.success && Array.isArray(certData.data)) {
            setCertificates(certData.data);
          }

          const paymentData = results[3];
          if (paymentData?.success && Array.isArray(paymentData.data)) {
            setPayments(paymentData.data);
          }

          if (['PRESIDENT', 'GS', 'PLATFORM_ADMIN'].includes(currentUser.role) && results[4]) {
            const approvalData = results[4];
            if (approvalData?.success && Array.isArray(approvalData.data?.users)) {
              setPendingUsers(approvalData.data.users);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser]);

  const role = currentUser?.role || 'GUEST';
  const greeting = useMemo(() => getGreeting(), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-36 rounded-2xl border border-white/10 bg-[#0e1712] animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-white/10 bg-[#0e1712] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const renderStatCards = () => {
    switch (role) {
      case 'MEMBER':
        return (
          <>
            <StatCard icon={Calendar} label="Active Events" value={stats?.activeEvents ?? 0} trend="up" delay={0} />
            <StatCard icon={Award} label="My Certificates" value={certificates.length} trend="up" delay={0.1} />
            <StatCard icon={CreditCard} label="Payment Records" value={payments.length} trend="neutral" delay={0.2} />
            <StatCard icon={Calendar} label="Upcoming Labs" value={stats?.upcomingEvents?.length ?? 0} trend="up" delay={0.3} />
          </>
        );
      case 'MEDIA':
        return (
          <>
            <StatCard icon={Calendar} label="Active Events" value={stats?.activeEvents ?? 0} trend="up" delay={0} />
            <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0} trend="up" delay={0.1} />
            <StatCard icon={Camera} label="Gallery Photos" value="Active" trend="up" delay={0.2} />
            <StatCard icon={Megaphone} label="Announcements" value="Online" trend="neutral" delay={0.3} />
          </>
        );
      case 'TREASURER':
        return (
          <>
            <StatCard icon={DollarSign} label="Total Funds" value={`৳${(stats?.totalFunds ?? 0).toLocaleString()}`} trend="up" delay={0} />
            <StatCard icon={CreditCard} label="Pending Verifications" value={stats?.pendingApprovals ?? 0} trend="neutral" delay={0.1} />
            <StatCard icon={CheckCircle} label="Verified Dues" value={payments.filter((p) => p.status === 'VERIFIED').length} trend="up" delay={0.2} />
            <StatCard icon={Activity} label="Treasury Balance" value={`৳${(stats?.totalFunds ?? 0).toLocaleString()}`} trend="neutral" delay={0.3} />
          </>
        );
      case 'GS':
        return (
          <>
            <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0} trend="up" delay={0} />
            <StatCard icon={AlertTriangle} label="Pending Approvals" value={pendingUsers.length} trend="neutral" delay={0.1} />
            <StatCard icon={Calendar} label="Active Events" value={stats?.activeEvents ?? 0} trend="up" delay={0.2} />
            <StatCard icon={DollarSign} label="Treasury Balance" value={`৳${(stats?.totalFunds ?? 0).toLocaleString()}`} trend="up" delay={0.3} />
          </>
        );
      case 'VP':
        return (
          <>
            <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0} trend="up" delay={0} />
            <StatCard icon={Calendar} label="Active Events" value={stats?.activeEvents ?? 0} trend="up" delay={0.1} />
            <StatCard icon={BarChart3} label="Growth Rate" value="12%" trend="up" delay={0.2} />
            <StatCard icon={Award} label="Certificates Issued" value={0} trend="neutral" delay={0.3} />
          </>
        );
      case 'PRESIDENT':
        return (
          <>
            <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0} trend="up" delay={0} />
            <StatCard icon={DollarSign} label="Total Funds" value={`৳${(stats?.totalFunds ?? 0).toLocaleString()}`} trend="up" delay={0.1} />
            <StatCard icon={AlertTriangle} label="Pending Approvals" value={pendingUsers.length} trend="neutral" delay={0.2} />
            <StatCard icon={Calendar} label="Active Events" value={stats?.activeEvents ?? 0} trend="up" delay={0.3} />
          </>
        );
      case 'VERIFIER':
        return (
          <>
            <StatCard icon={Calendar} label="Assigned Events" value={stats?.activeEvents ?? 0} trend="neutral" delay={0} />
            <StatCard icon={CheckCircle} label="Pending Payments" value={stats?.pendingApprovals ?? 0} trend="neutral" delay={0.1} />
            <StatCard icon={Shield} label="Verified Today" value={0} trend="up" delay={0.2} />
            <StatCard icon={Activity} label="Total Verified" value={0} trend="up" delay={0.3} />
          </>
        );
      case 'PLATFORM_ADMIN':
        return (
          <>
            <StatCard icon={Users} label="Total Users" value={stats?.totalMembers ?? 0} trend="up" delay={0} />
            <StatCard icon={Activity} label="System Health" value="99.9%" trend="up" delay={0.1} />
            <StatCard icon={Settings} label="Audit Logs" value={auditLogs.length} trend="neutral" delay={0.2} />
            <StatCard icon={AlertTriangle} label="System Alerts" value={pendingUsers.length} trend="neutral" delay={0.3} />
          </>
        );
      default:
        return (
          <>
            <StatCard icon={Users} label="Members" value={stats?.totalMembers ?? 0} delay={0} />
            <StatCard icon={Calendar} label="Events" value={stats?.activeEvents ?? 0} delay={0.1} />
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. EXECUTIVE HERO GREETING CARD (HIGH CONTRAST & AMBIENT GLOW) */}
      <div className="relative rounded-3xl border border-emerald-500/25 bg-gradient-to-b from-[#0e1a14]/90 via-[#0a130e]/90 to-[#070e0a]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Top-right ambient lighting */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-emerald-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>[ EXECUTIVE TELEMETRY ACTIVE ]</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {greeting},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                {currentUser?.name || 'Executive'}
              </span>
            </h1>

            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs text-gray-300">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-0.5">
                {ROLE_LABELS[role]}
              </Badge>
              {currentUser?.studentId && (
                <span className="text-gray-400">ID: <strong className="text-white">{currentUser.studentId}</strong></span>
              )}
              {currentUser?.batch && (
                <span className="text-gray-400">• Batch: <strong className="text-white">{currentUser.batch}</strong></span>
              )}
            </div>
          </div>

          {/* Action Chips */}
          <div className="flex flex-wrap items-center gap-2.5">
            {['PRESIDENT', 'GS', 'PLATFORM_ADMIN'].includes(role) && (
              <Button
                size="sm"
                onClick={() => setCurrentView('member-approval')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs px-4 h-9 shadow-lg shadow-emerald-500/20"
              >
                <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                Review Applications ({pendingUsers.length})
              </Button>
            )}

            {['PRESIDENT', 'GS', 'MEDIA', 'PLATFORM_ADMIN'].includes(role) && (
              <Button
                size="sm"
                onClick={() => setCurrentView('announcements')}
                variant="outline"
                className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 font-mono text-xs px-3.5 h-9"
              >
                <Megaphone className="mr-1.5 h-3.5 w-3.5" />
                New Notice
              </Button>
            )}

            {['TREASURER'].includes(role) && (
              <Button
                size="sm"
                onClick={() => setCurrentView('verify-payments')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs px-4 h-9 shadow-lg shadow-emerald-500/20"
              >
                <Wallet className="mr-1.5 h-3.5 w-3.5" />
                Verify Payments
              </Button>
            )}

            {['MEDIA'].includes(role) && (
              <Button
                size="sm"
                onClick={() => setCurrentView('gallery')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs px-4 h-9 shadow-lg shadow-emerald-500/20"
              >
                <Camera className="mr-1.5 h-3.5 w-3.5" />
                Upload Photo
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentView('landing')}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-xs px-3.5 h-9"
            >
              <Globe className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
              Public Site ↗
            </Button>
          </div>
        </div>
      </div>

      {/* 2. STAT CARDS (SURFACE L2 ELEVATED TILES) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {renderStatCards()}
      </div>

      {/* 3. MAIN WORKSPACE GRID */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card className="border-white/10 bg-[#0c140f]/90 backdrop-blur-xl shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-base font-mono font-bold text-white">Upcoming Sessions</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('events')}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            >
              View Calendar ➔
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {(stats?.upcomingEvents || []).length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Calendar className="h-8 w-8 text-gray-600 mx-auto" />
                  <p className="text-xs text-gray-400">No upcoming workshops scheduled yet.</p>
                </div>
              ) : (
                (stats?.upcomingEvents || []).slice(0, 5).map((event, index) => {
                  const borderColor = EVENT_CATEGORY_COLORS[event.category] || '#10b981';
                  return (
                    <div
                      key={event.id}
                      onClick={() => setCurrentView('events')}
                      className="cursor-pointer rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]"
                    >
                      <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-1">
                        <span className="font-bold text-emerald-400">{event.category || 'WORKSHOP'}</span>
                        <span>{new Date(event.startDate).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-mono font-bold text-sm text-white line-clamp-1">
                        {event.title}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-1 font-sans">
                        {event.description || 'Hands-on practical session.'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Audit / Club Activity Feed */}
        <Card className="border-white/10 bg-[#0c140f]/90 backdrop-blur-xl shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <CardTitle className="text-base font-mono font-bold text-white">Live Activity Feed</CardTitle>
            </div>
            {['PLATFORM_ADMIN', 'PRESIDENT'].includes(role) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('audit-logs')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                Audit Trail ➔
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Activity className="h-8 w-8 text-gray-600 mx-auto" />
                  <p className="text-xs text-gray-400">No recent club activity logged.</p>
                </div>
              ) : (
                auditLogs.map((log) => {
                  const cfg = ACTION_CONFIG[log.action] || { icon: Activity, color: '#10b981', label: log.action };
                  const ActionIcon = cfg.icon;

                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10"
                          style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                        >
                          <ActionIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono font-bold text-white truncate">{cfg.label}</p>
                          <p className="text-[11px] text-gray-400 truncate">{log.details}</p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-gray-500 shrink-0">
                        {timeAgo(log.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
