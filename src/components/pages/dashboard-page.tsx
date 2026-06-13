'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Award, CreditCard, DollarSign, CheckCircle, AlertTriangle, BarChart3, FileText, Shield, Settings, Activity, TrendingUp, Bell, Info, Clock, UserCheck, Wallet, ShieldCheck, Ban, Receipt, Megaphone } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { UserRole, Event, Payment, Certificate, User } from '@/types';
import { StatCard } from '@/components/shared/stat-card';
import { EventBadge, MembershipBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalMembers: number; totalFunds: number; activeEvents: number; pendingApprovals: number;
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
  BUDGET_CREATED: { icon: DollarSign, color: '#06b6d4', label: 'Budget Created' },
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

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
  const { currentUser, setCurrentView, setSelectedEventId, notifications } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const statsRes = await fetch('/api/stats');
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
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

        // Fetch audit logs for activity feed
        const auditRes = await fetch('/api/audit-logs?limit=5');
        const auditData = await auditRes.json();
        if (auditData.success) setAuditLogs(auditData.data.auditLogs || []);

        if (currentUser) {
          const certRes = await fetch(`/api/certificates?userId=${currentUser.id}`);
          const certData = await certRes.json();
          if (certData.success) setCertificates(certData.data.certificates || []);

          const payRes = await fetch(`/api/payments?userId=${currentUser.id}`);
          const payData = await payRes.json();
          if (payData.success) setPayments(payData.data.payments || []);

          if (['PRESIDENT', 'GS', 'PLATFORM_ADMIN'].includes(currentUser.role)) {
            const pendingRes = await fetch('/api/users/approval');
            const pendingData = await pendingRes.json();
            if (pendingData.success) setPendingUsers(pendingData.data.users || []);
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [currentUser]);

  const role = currentUser?.role || 'GUEST';

  const recentNotifications = useMemo(() => {
    return notifications.slice(0, 3);
  }, [notifications]);

  const greeting = useMemo(() => getGreeting(), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-white/5" />)}
        </div>
      </div>
    );
  }

  const renderStatCards = () => {
    switch (role) {
      case 'MEMBER':
        return (
          <>
            <StatCard icon={Calendar} label="My Events" value={stats?.activeEvents ?? 0} trend="up" delay={0} progress={65} progressColor="#10b981" />
            <StatCard icon={Award} label="My Certificates" value={certificates.length} trend="up" delay={0.1} progress={certificates.length > 0 ? 80 : 20} progressColor="#06b6d4" />
            <StatCard icon={CreditCard} label="Payments" value={payments.length} trend="neutral" delay={0.2} />
            <StatCard icon={Calendar} label="Upcoming Events" value={stats?.upcomingEvents?.length ?? 0} trend="up" delay={0.3} progress={stats?.upcomingEvents?.length ? Math.min((stats.upcomingEvents.length / 5) * 100, 100) : 0} progressColor="#f59e0b" />
          </>
        );
      case 'MEDIA':
        return (
          <>
            <StatCard icon={Calendar} label="Active Events" value={stats?.activeEvents ?? 0} trend="up" delay={0} progress={70} progressColor="#10b981" />
            <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0} trend="up" delay={0.1} progress={85} progressColor="#06b6d4" />
            <StatCard icon={FileText} label="Announcements" value={0} trend="neutral" delay={0.2} />
            <StatCard icon={BarChart3} label="Registrations" value={0} trend="up" delay={0.3} />
          </>
        );
      case 'TREASURER':
        return (
          <>
            <StatCard icon={DollarSign} label="Total Funds" value={`৳${(stats?.totalFunds ?? 0).toLocaleString()}`} trend="up" delay={0} progress={78} progressColor="#10b981" />
            <StatCard icon={CreditCard} label="Pending Verifications" value={stats?.pendingApprovals ?? 0} trend="neutral" delay={0.1} progress={stats?.pendingApprovals ? Math.min((stats.pendingApprovals / 10) * 100, 100) : 0} progressColor="#f59e0b" />
            <StatCard icon={CheckCircle} label="Verified Payments" value={payments.filter(p => p.status === 'VERIFIED').length} trend="up" delay={0.2} progress={90} progressColor="#06b6d4" />
            <StatCard icon={Activity} label="Active Budgets" value={1} trend="neutral" delay={0.3} />
          </>
        );
      case 'GS':
        return (
          <>
            <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0} trend="up" delay={0} progress={85} progressColor="#10b981" />
            <StatCard icon={AlertTriangle} label="Pending Approvals" value={pendingUsers.length} trend="neutral" delay={0.1} progress={pendingUsers.length > 0 ? 60 : 5} progressColor="#f59e0b" />
            <StatCard icon={Calendar} label="Active Events" value={stats?.activeEvents ?? 0} trend="up" delay={0.2} progress={70} progressColor="#06b6d4" />
            <StatCard icon={FileText} label="Pending Expenses" value={0} trend="neutral" delay={0.3} />
          </>
        );
      case 'VP':
        return (
          <>
            <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0} trend="up" delay={0} progress={85} progressColor="#10b981" />
            <StatCard icon={Calendar} label="Active Events" value={stats?.activeEvents ?? 0} trend="up" delay={0.1} progress={65} progressColor="#06b6d4" />
            <StatCard icon={BarChart3} label="Growth Rate" value="12%" trend="up" delay={0.2} progress={12} progressColor="#8b5cf6" />
            <StatCard icon={Award} label="Certificates Issued" value={0} trend="neutral" delay={0.3} />
          </>
        );
      case 'PRESIDENT':
        return (
          <>
            <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0} trend="up" delay={0} progress={90} progressColor="#10b981" />
            <StatCard icon={DollarSign} label="Total Funds" value={`৳${(stats?.totalFunds ?? 0).toLocaleString()}`} trend="up" delay={0.1} progress={78} progressColor="#06b6d4" />
            <StatCard icon={Calendar} label="Active Events" value={stats?.activeEvents ?? 0} trend="up" delay={0.2} progress={65} progressColor="#f59e0b" />
            <StatCard icon={AlertTriangle} label="System Alerts" value={stats?.pendingApprovals ?? 0} trend="neutral" delay={0.3} progress={stats?.pendingApprovals ? Math.min((stats.pendingApprovals / 10) * 100, 100) : 0} progressColor="#ef4444" />
          </>
        );
      case 'VERIFIER':
        return (
          <>
            <StatCard icon={Calendar} label="Assigned Events" value={stats?.activeEvents ?? 0} trend="neutral" delay={0} progress={50} progressColor="#10b981" />
            <StatCard icon={CheckCircle} label="Pending Verifications" value={stats?.pendingApprovals ?? 0} trend="neutral" delay={0.1} progress={stats?.pendingApprovals ? Math.min((stats.pendingApprovals / 10) * 100, 100) : 0} progressColor="#f59e0b" />
            <StatCard icon={Shield} label="Verified Today" value={0} trend="up" delay={0.2} />
            <StatCard icon={Activity} label="Total Verified" value={0} trend="up" delay={0.3} progress={30} progressColor="#06b6d4" />
          </>
        );
      case 'PLATFORM_ADMIN':
        return (
          <>
            <StatCard icon={Users} label="Total Users" value={stats?.totalMembers ?? 0} trend="up" delay={0} progress={95} progressColor="#10b981" />
            <StatCard icon={Activity} label="System Health" value="99.9%" trend="up" delay={0.1} progress={99} progressColor="#06b6d4" />
            <StatCard icon={Settings} label="Recent Actions" value={stats?.recentActivity?.length ?? 0} trend="neutral" delay={0.2} />
            <StatCard icon={AlertTriangle} label="Alerts" value={stats?.pendingApprovals ?? 0} trend="neutral" delay={0.3} progress={stats?.pendingApprovals ? Math.min((stats.pendingApprovals / 10) * 100, 100) : 0} progressColor="#ef4444" />
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
      {/* Greeting Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting}, <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{currentUser?.name?.split(' ')[0] || 'Guest'}</span>
          </h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {renderStatCards()}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card className={`border-white/5 bg-[#111]/60 backdrop-blur ${role === 'GUEST' ? 'lg:col-span-2' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-white">Upcoming Events</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('events')} className="text-xs text-emerald-400">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {(stats?.upcomingEvents || []).slice(0, 5).map((event, index) => {
                const borderColor = EVENT_CATEGORY_COLORS[event.category] || '#10b981';
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 cursor-pointer hover:bg-white/[0.04] transition-all duration-200 group"
                    style={{ borderLeftWidth: '3px', borderLeftColor: borderColor }}
                    onClick={() => { setSelectedEventId(event.id); setCurrentView('event-detail'); }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${borderColor}15` }}>
                      <Calendar className="h-5 w-5" style={{ color: borderColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-emerald-300 transition-colors">{event.title}</p>
                      <p className="text-xs text-gray-500 truncate">{new Date(event.startDate).toLocaleDateString()} • {event.venue}</p>
                    </div>
                    <EventBadge status={event.status} />
                  </motion.div>
                );
              })}
              {(!stats?.upcomingEvents || stats.upcomingEvents.length === 0) && (
                <p className="py-8 text-center text-sm text-gray-500">No upcoming events</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        {role !== 'GUEST' && (
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                <Activity className="h-5 w-5 text-emerald-400" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('audit-logs')} className="text-xs text-emerald-400">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-0 max-h-80 overflow-y-auto custom-scrollbar">
                {auditLogs.length > 0 ? auditLogs.map((log, index) => {
                  const config = ACTION_CONFIG[log.action] || { icon: Activity, color: '#6b7280', label: log.action };
                  const IconComp = config.icon;
                  const isLast = index === auditLogs.length - 1;
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 relative"
                    >
                      {/* Timeline line */}
                      {!isLast && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gradient-to-b from-white/10 to-transparent" />
                      )}
                      {/* Icon */}
                      <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full z-10" style={{ backgroundColor: `${config.color}15` }}>
                        <IconComp className="h-3.5 w-3.5" style={{ color: config.color }} />
                      </div>
                      {/* Content */}
                      <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-4'}`}>
                        <p className="text-sm text-white">{config.label}</p>
                        <p className="text-xs text-gray-500 truncate">{log.details}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-600">{log.user?.name || 'System'}</span>
                          <span className="text-[10px] text-gray-700">•</span>
                          <span className="text-[10px] text-gray-600">{timeAgo(log.createdAt)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Activity className="mb-2 h-8 w-8 text-gray-600" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Deadlines & Pending Approvals Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
              <Clock className="h-5 w-5 text-amber-400" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {(() => {
                const now = new Date();
                const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const upcomingDeadlines = (stats?.upcomingEvents || []).filter(e => {
                  const eventDate = new Date(e.startDate);
                  return eventDate >= now && eventDate <= nextWeek;
                });
                if (upcomingDeadlines.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <Clock className="mb-2 h-8 w-8 text-gray-600" />
                      <p className="text-sm">No deadlines in the next 7 days</p>
                    </div>
                  );
                }
                return upcomingDeadlines.map((event, index) => {
                  const daysLeft = getDaysUntil(event.startDate);
                  const urgencyColor = daysLeft <= 1 ? '#ef4444' : daysLeft <= 3 ? '#f59e0b' : '#6b7280';
                  const urgencyLabel = daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`;
                  const urgencyBg = daysLeft <= 1 ? 'bg-red-500/10 border-red-500/20' : daysLeft <= 3 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-gray-500/10 border-gray-500/20';
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                      onClick={() => { setSelectedEventId(event.id); setCurrentView('event-detail'); }}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${urgencyColor}15` }}>
                        <Clock className="h-5 w-5" style={{ color: urgencyColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{event.title}</p>
                        <p className="text-xs text-gray-500">{new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${urgencyBg}`} style={{ color: urgencyColor }}>
                        {urgencyLabel}
                      </span>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals (for admin roles) */}
        {['PRESIDENT', 'GS', 'PLATFORM_ADMIN'].includes(role) && (
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                Pending Approvals
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('member-approval')} className="text-xs text-amber-400">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {pendingUsers.length > 0 ? pendingUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-sm font-bold">{u.name?.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email} • {u.department}</p>
                    </div>
                    <MembershipBadge status={u.membershipStatus} />
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <CheckCircle className="mb-2 h-8 w-8 text-emerald-600" />
                    <p className="text-sm">All caught up!</p>
                    <p className="text-xs text-gray-600">No pending approvals</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {role === 'MEMBER' && (
              <>
                <Button onClick={() => setCurrentView('events')} className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 border-0 shadow-lg shadow-emerald-500/20">
                  <Calendar className="mr-2 h-4 w-4" />Register for Event
                </Button>
                <Button onClick={() => setCurrentView('certificates')} className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:from-cyan-500 hover:to-cyan-400 border-0 shadow-lg shadow-cyan-500/20">
                  <Award className="mr-2 h-4 w-4" />View Certificates
                </Button>
              </>
            )}
            {role === 'MEDIA' && <Button onClick={() => setCurrentView('create-event')} className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 border-0 shadow-lg shadow-emerald-500/20"><Calendar className="mr-2 h-4 w-4" />Create Event</Button>}
            {role === 'TREASURER' && (
              <>
                <Button onClick={() => setCurrentView('verify-payments')} className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 border-0 shadow-lg shadow-emerald-500/20"><CheckCircle className="mr-2 h-4 w-4" />Verify Payments</Button>
                <Button onClick={() => setCurrentView('budgets')} className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:from-cyan-500 hover:to-cyan-400 border-0 shadow-lg shadow-cyan-500/20"><DollarSign className="mr-2 h-4 w-4" />Manage Budgets</Button>
              </>
            )}
            {role === 'PRESIDENT' && (
              <>
                <Button onClick={() => setCurrentView('members')} className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 border-0 shadow-lg shadow-emerald-500/20"><Users className="mr-2 h-4 w-4" />Manage Members</Button>
                <Button onClick={() => setCurrentView('roles')} className="bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 border-0 shadow-lg shadow-amber-500/20"><Shield className="mr-2 h-4 w-4" />Assign Roles</Button>
                <Button onClick={() => setCurrentView('audit-logs')} className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:from-cyan-500 hover:to-cyan-400 border-0 shadow-lg shadow-cyan-500/20"><FileText className="mr-2 h-4 w-4" />Audit Logs</Button>
              </>
            )}
            {role === 'GS' && <Button onClick={() => setCurrentView('members')} className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 border-0 shadow-lg shadow-emerald-500/20"><Users className="mr-2 h-4 w-4" />Approve Members</Button>}
            {role === 'VERIFIER' && <Button onClick={() => setCurrentView('verify-payments')} className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 border-0 shadow-lg shadow-emerald-500/20"><CheckCircle className="mr-2 h-4 w-4" />Verify Payments</Button>}
          </div>
        </CardContent>
      </Card>

      {/* Insights Chart - For leadership roles */}
      {['PRESIDENT', 'VP', 'TREASURER', 'PLATFORM_ADMIN'].includes(role) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg text-white"><TrendingUp className="h-5 w-5 text-emerald-400" />Member Growth</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { month: 'Jan', members: 3 }, { month: 'Feb', members: 5 }, { month: 'Mar', members: 6 },
                  { month: 'Apr', members: 7 }, { month: 'May', members: 9 }, { month: 'Jun', members: stats?.totalMembers || 10 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Bar dataKey="members" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg text-white"><BarChart3 className="h-5 w-5 text-cyan-400" />Event Distribution</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Workshops', value: 35, fill: '#10b981' },
                      { name: 'CTF', value: 25, fill: '#06b6d4' },
                      { name: 'Seminars', value: 20, fill: '#f59e0b' },
                      { name: 'Meetups', value: 15, fill: '#8b5cf6' },
                      { name: 'Training', value: 5, fill: '#ef4444' },
                    ]}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                  >
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-wrap justify-center gap-3">
                {[{n:'Workshops',c:'#10b981'},{n:'CTF',c:'#06b6d4'},{n:'Seminars',c:'#f59e0b'},{n:'Meetups',c:'#8b5cf6'},{n:'Training',c:'#ef4444'}].map(item => (
                  <div key={item.n} className="flex items-center gap-1.5 text-xs"><div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:item.c}}/><span className="text-gray-400">{item.n}</span></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Notifications Section */}
      <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
            <Bell className="h-5 w-5 text-cyan-400" />
            Recent Notifications
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('notifications')} className="text-xs text-cyan-400">View All</Button>
        </CardHeader>
        <CardContent>
          {recentNotifications.length > 0 ? (
            <div className="space-y-3">
              {recentNotifications.map((notification, index) => {
                const typeColor = notification.type === 'SUCCESS' ? '#10b981' : notification.type === 'WARNING' ? '#f59e0b' : notification.type === 'ERROR' ? '#ef4444' : '#06b6d4';
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
                    style={{ borderLeftWidth: '3px', borderLeftColor: typeColor }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${typeColor}15` }}>
                      <Info className="h-4 w-4" style={{ color: typeColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{notification.title}</p>
                      <p className="text-xs text-gray-500 truncate">{notification.message}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-gray-600">
                      {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Bell className="mb-2 h-8 w-8 text-gray-600" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
