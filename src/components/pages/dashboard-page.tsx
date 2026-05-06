'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Award, CreditCard, DollarSign, CheckCircle, AlertTriangle, BarChart3, FileText, Shield, Settings, Activity, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { UserRole, Event, Payment, Certificate, User } from '@/types';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalMembers: number; totalFunds: number; activeEvents: number; pendingApprovals: number;
  recentActivity: { action: string; details: string; createdAt: string }[];
  upcomingEvents: Event[];
}

export function DashboardPage() {
  const { currentUser, setCurrentView, setSelectedEventId } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
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

        if (currentUser) {
          const certRes = await fetch(`/api/certificates?userId=${currentUser.id}`);
          const certData = await certRes.json();
          if (certData.success) setCertificates(certData.data || []);

          const payRes = await fetch(`/api/payments?userId=${currentUser.id}`);
          const payData = await payRes.json();
          if (payData.success) setPayments(payData.data || []);

          if (['PRESIDENT', 'GS', 'PLATFORM_ADMIN'].includes(currentUser.role)) {
            const pendingRes = await fetch('/api/users/approval');
            const pendingData = await pendingRes.json();
            if (pendingData.success) setPendingUsers(pendingData.data || []);
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [currentUser]);

  const role = currentUser?.role || 'GUEST';

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
            <StatCard icon={Calendar} label="My Events" value={stats?.activeEvents ?? 0} trend="up" delay={0} />
            <StatCard icon={Award} label="My Certificates" value={certificates.length} trend="up" delay={0.1} />
            <StatCard icon={CreditCard} label="Payments" value={payments.length} trend="neutral" delay={0.2} />
            <StatCard icon={Calendar} label="Upcoming Events" value={stats?.upcomingEvents?.length ?? 0} trend="up" delay={0.3} />
          </>
        );
      case 'MEDIA':
        return (
          <>
            <StatCard icon={Calendar} label="Active Events" value={stats?.activeEvents ?? 0} trend="up" delay={0} />
            <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0} trend="up" delay={0.1} />
            <StatCard icon={FileText} label="Announcements" value={0} trend="neutral" delay={0.2} />
            <StatCard icon={BarChart3} label="Registrations" value={0} trend="up" delay={0.3} />
          </>
        );
      case 'TREASURER':
        return (
          <>
            <StatCard icon={DollarSign} label="Total Funds" value={`৳${(stats?.totalFunds ?? 0).toLocaleString()}`} trend="up" delay={0} />
            <StatCard icon={CreditCard} label="Pending Verifications" value={stats?.pendingApprovals ?? 0} trend="neutral" delay={0.1} />
            <StatCard icon={CheckCircle} label="Verified Payments" value={payments.filter(p => p.status === 'VERIFIED').length} trend="up" delay={0.2} />
            <StatCard icon={Activity} label="Active Budgets" value={1} trend="neutral" delay={0.3} />
          </>
        );
      case 'GS':
        return (
          <>
            <StatCard icon={Users} label="Total Members" value={stats?.totalMembers ?? 0} trend="up" delay={0} />
            <StatCard icon={AlertTriangle} label="Pending Approvals" value={pendingUsers.length} trend="neutral" delay={0.1} />
            <StatCard icon={Calendar} label="Active Events" value={stats?.activeEvents ?? 0} trend="up" delay={0.2} />
            <StatCard icon={FileText} label="Pending Expenses" value={0} trend="neutral" delay={0.3} />
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
            <StatCard icon={Calendar} label="Active Events" value={stats?.activeEvents ?? 0} trend="up" delay={0.2} />
            <StatCard icon={AlertTriangle} label="System Alerts" value={stats?.pendingApprovals ?? 0} trend="neutral" delay={0.3} />
          </>
        );
      case 'VERIFIER':
        return (
          <>
            <StatCard icon={Calendar} label="Assigned Events" value={stats?.activeEvents ?? 0} trend="neutral" delay={0} />
            <StatCard icon={CheckCircle} label="Pending Verifications" value={stats?.pendingApprovals ?? 0} trend="neutral" delay={0.1} />
            <StatCard icon={Shield} label="Verified Today" value={0} trend="up" delay={0.2} />
            <StatCard icon={Activity} label="Total Verified" value={0} trend="up" delay={0.3} />
          </>
        );
      case 'PLATFORM_ADMIN':
        return (
          <>
            <StatCard icon={Users} label="Total Users" value={stats?.totalMembers ?? 0} trend="up" delay={0} />
            <StatCard icon={Activity} label="System Health" value="99.9%" trend="up" delay={0.1} />
            <StatCard icon={Settings} label="Recent Actions" value={stats?.recentActivity?.length ?? 0} trend="neutral" delay={0.2} />
            <StatCard icon={AlertTriangle} label="Alerts" value={stats?.pendingApprovals ?? 0} trend="neutral" delay={0.3} />
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {currentUser?.name || 'Guest'}</p>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {renderStatCards()}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-white">Upcoming Events</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('events')} className="text-xs text-emerald-400">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(stats?.upcomingEvents || []).slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 cursor-pointer hover:border-emerald-500/20 transition-colors" onClick={() => { setSelectedEventId(event.id); setCurrentView('event-detail'); }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Calendar className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{event.title}</p>
                    <p className="text-xs text-gray-500 truncate">{new Date(event.startDate).toLocaleDateString()} • {event.venue}</p>
                  </div>
                  <StatusBadge type="event" status={event.status} />
                </div>
              ))}
              {(!stats?.upcomingEvents || stats.upcomingEvents.length === 0) && (
                <p className="py-8 text-center text-sm text-gray-500">No upcoming events</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role-specific quick actions / recent activity */}
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-white">
              {['PRESIDENT', 'GS'].includes(role) ? 'Pending Approvals' : role === 'TREASURER' ? 'Recent Transactions' : 'Recent Activity'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {['PRESIDENT', 'GS', 'PLATFORM_ADMIN'].includes(role) && pendingUsers.length > 0 ? pendingUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-sm font-bold">{u.name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email} • {u.department}</p>
                  </div>
                  <StatusBadge type="membership" status={u.membershipStatus} />
                </div>
              )) : (stats?.recentActivity || []).length > 0 ? (stats?.recentActivity || []).slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <Activity className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                  <div>
                    <p className="text-sm text-white">{a.action}</p>
                    <p className="text-xs text-gray-500">{a.details}</p>
                    <p className="mt-1 text-[10px] text-gray-600">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              )) : <p className="py-8 text-center text-sm text-gray-500">No recent activity</p>}
            </div>
          </CardContent>
        </Card>
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
                <Button onClick={() => setCurrentView('events')} variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"><Calendar className="mr-2 h-4 w-4" />Register for Event</Button>
                <Button onClick={() => setCurrentView('certificates')} variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"><Award className="mr-2 h-4 w-4" />View Certificates</Button>
              </>
            )}
            {role === 'MEDIA' && <Button onClick={() => setCurrentView('create-event')} variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"><Calendar className="mr-2 h-4 w-4" />Create Event</Button>}
            {role === 'TREASURER' && (
              <>
                <Button onClick={() => setCurrentView('verify-payments')} variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"><CheckCircle className="mr-2 h-4 w-4" />Verify Payments</Button>
                <Button onClick={() => setCurrentView('budgets')} variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"><DollarSign className="mr-2 h-4 w-4" />Manage Budgets</Button>
              </>
            )}
            {role === 'PRESIDENT' && (
              <>
                <Button onClick={() => setCurrentView('members')} variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"><Users className="mr-2 h-4 w-4" />Manage Members</Button>
                <Button onClick={() => setCurrentView('roles')} variant="outline" className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10"><Shield className="mr-2 h-4 w-4" />Assign Roles</Button>
                <Button onClick={() => setCurrentView('audit-logs')} variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"><FileText className="mr-2 h-4 w-4" />Audit Logs</Button>
              </>
            )}
            {role === 'GS' && <Button onClick={() => setCurrentView('members')} variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"><Users className="mr-2 h-4 w-4" />Approve Members</Button>}
            {role === 'VERIFIER' && <Button onClick={() => setCurrentView('verify-payments')} variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"><CheckCircle className="mr-2 h-4 w-4" />Verify Payments</Button>}
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
    </div>
  );
}
