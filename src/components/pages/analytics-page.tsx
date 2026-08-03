'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, Calendar, DollarSign, Activity,
  Award, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/stat-card';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

const CATEGORY_LABELS: Record<string, string> = {
  WORKSHOP: 'Workshop',
  SEMINAR: 'Seminar',
  TRAINING: 'Training',
  CTF: 'CTF',
  MEETUP: 'Meetup',
};

const DEPT_COLORS = [
  '#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f97316',
];

const tooltipStyle = {
  backgroundColor: '#1a1a2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: 12,
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function AnalyticsPage() {
  const { currentUser } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, eventsRes, paymentsRes, usersRes] = await Promise.all([
          fetch('/api/stats').then(r => r.json()).catch(() => null),
          fetch('/api/events').then(r => r.json()).catch(() => null),
          fetch('/api/payments').then(r => r.json()).catch(() => null),
          fetch('/api/users').then(r => r.json()).catch(() => null),
        ]);
        if (statsRes?.success) setStats(statsRes.data?.stats || statsRes.data);
        if (eventsRes?.success) setEvents(eventsRes.data?.events || []);
        if (paymentsRes?.success) setPayments(paymentsRes.data?.payments || []);
        if (usersRes?.success) setUsers(usersRes.data?.users || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // --- Derived data ---

  const totalMembers = stats?.totalMembers || users.length;
  const activeMembers = stats?.activeMembers || users.filter((u: any) => u.membershipStatus === 'ACTIVE').length;
  const activeEvents = stats?.activeEvents || events.filter((e: any) => ['UPCOMING', 'ONGOING'].includes(e.status)).length;
  const totalFunds = stats?.totalFunds || payments.filter((p: any) => p.status === 'VERIFIED' && p.type !== 'EVENT').reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const totalEvents = stats?.totalEvents || events.length;
  const retentionRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;

  // New members this month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newMembersThisMonth = users.filter((u: any) => new Date(u.createdAt) >= thisMonthStart).length;

  // Member growth by month (from real user data)
  const memberGrowth = useMemo(() => {
    if (users.length === 0) {
      return [
        { month: 'Jan', members: 0 }, { month: 'Feb', members: 0 }, { month: 'Mar', members: 0 },
        { month: 'Apr', members: 0 }, { month: 'May', members: 0 }, { month: 'Jun', members: 0 },
      ];
    }
    const sorted = [...users].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const monthMap: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthMap[key] = 0;
    }

    let cumulative = 0;
    const earliest = new Date(sorted[0]?.createdAt || now);
    // Count users registered before our 6-month window
    const windowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    cumulative = users.filter((u: any) => new Date(u.createdAt) < windowStart).length;

    const entries: { month: string; members: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = months[d.getMonth()];
      const newInMonth = users.filter((u: any) => {
        const cd = new Date(u.createdAt);
        return cd >= d && cd < nextD;
      }).length;
      cumulative += newInMonth;
      entries.push({ month: label, members: cumulative });
    }
    return entries;
  }, [users]);

  // Event category distribution (from real events)
  const eventCategories = useMemo(() => {
    const catMap: Record<string, number> = {};
    for (const ev of events) {
      const cat = ev.category || 'WORKSHOP';
      catMap[cat] = (catMap[cat] || 0) + 1;
    }
    return Object.entries(catMap).map(([name, value]) => ({
      name: CATEGORY_LABELS[name] || name,
      value,
    }));
  }, [events]);

  // Revenue by month (from real payments)
  const monthlyRevenue = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = months[d.getMonth()];
      revMap[label] = 0;
    }
    for (const p of payments) {
      if (p.status !== 'VERIFIED') continue;
      const pd = new Date(p.createdAt);
      const label = months[pd.getMonth()];
      if (label in revMap) {
        revMap[label] += p.amount || 0;
      }
    }
    return Object.entries(revMap).map(([month, revenue]) => ({ month, revenue }));
  }, [payments]);

  // Registration trends (from event registrations)
  const registrationTrends = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const regMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = months[d.getMonth()];
      regMap[label] = 0;
    }
    for (const ev of events) {
      const regCount = ev._count?.registrations || 0;
      const ed = new Date(ev.createdAt);
      const label = months[ed.getMonth()];
      if (label in regMap) {
        regMap[label] += regCount;
      }
    }
    return Object.entries(regMap).map(([month, registrations]) => ({ month, registrations }));
  }, [events]);

  // Top events by registration count
  const topEvents = useMemo(() => {
    return [...events]
      .sort((a: any, b: any) => (b._count?.registrations || 0) - (a._count?.registrations || 0))
      .slice(0, 5)
      .map((ev: any) => ({
        id: ev.id,
        title: ev.title,
        category: ev.category,
        date: ev.startDate,
        registrations: ev._count?.registrations || 0,
        maxSeats: ev.maxSeats || 0,
        fillRate: ev.maxSeats ? Math.round(((ev.currentSeats || ev._count?.registrations || 0) / ev.maxSeats) * 100) : 0,
      }));
  }, [events]);

  // Department distribution (from real users)
  const departmentDist = useMemo(() => {
    const deptMap: Record<string, number> = {};
    for (const u of users) {
      const dept = u.department || 'Unspecified';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    }
    return Object.entries(deptMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [users]);

  // Custom label for pie chart center
  const renderCenterLabel = () => {
    return (
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-white">
        <tspan fontSize="24" fontWeight="bold">{totalEvents}</tspan>
        <tspan x="50%" dy="18" fontSize="11" fill="#9ca3af">Events</tspan>
      </text>
    );
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Gradient Header Banner */}
      <motion.div variants={item} className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/15 to-emerald-600/10 border border-emerald-500/10 p-6">
        {/* SVG Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
        {/* Blur Orbs */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
            <BarChart3 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-gray-400">Club performance insights and trends</p>
          </div>
        </div>
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Members"
          value={totalMembers}
          trend={newMembersThisMonth > 0 ? 'up' : 'neutral'}
          trendValue={newMembersThisMonth}
          trendLabel={`+${newMembersThisMonth} this month`}
          delay={0}
        />
        <StatCard
          icon={Calendar}
          label="Active Events"
          value={activeEvents}
          trend={activeEvents > 0 ? 'up' : 'neutral'}
          trendLabel={`${totalEvents} total events`}
          delay={0.05}
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`৳${totalFunds.toLocaleString()}`}
          trend={totalFunds > 0 ? 'up' : 'neutral'}
          trendLabel="Verified payments"
          delay={0.1}
        />
        <StatCard
          icon={Activity}
          label="Member Retention"
          value={`${retentionRate}%`}
          trend={retentionRate >= 70 ? 'up' : retentionRate >= 40 ? 'neutral' : 'down'}
          trendLabel={`${activeMembers} active of ${totalMembers}`}
          delay={0.15}
        />
      </motion.div>

      {/* Charts Row 1: Member Growth + Event Category Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Member Growth - AreaChart */}
        <motion.div variants={item}>
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Member Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[250px] animate-pulse rounded-lg bg-white/5" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={memberGrowth}>
                    <defs>
                      <linearGradient id="memberGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="members"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#memberGradient)"
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6, fill: '#10b981' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Event Category Distribution - PieChart with center label */}
        <motion.div variants={item}>
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-cyan-400" />
                Event Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[250px] animate-pulse rounded-lg bg-white/5" />
              ) : eventCategories.length === 0 ? (
                <div className="flex h-[250px] items-center justify-center text-gray-500 text-sm">No events data</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={eventCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={renderCenterLabel}
                      >
                        {eventCategories.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex flex-wrap justify-center gap-3">
                    {eventCategories.map((cat, i) => (
                      <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-400">{cat.name}</span>
                        <span className="text-gray-600">({cat.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2: Revenue + Registration Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Overview */}
        <motion.div variants={item}>
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-400" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[250px] animate-pulse rounded-lg bg-white/5" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyRevenue}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Registration Trends */}
        <motion.div variants={item}>
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-violet-400" />
                Registration Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[250px] animate-pulse rounded-lg bg-white/5" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={registrationTrends}>
                    <defs>
                      <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="registrations"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#regGradient)"
                      dot={{ fill: '#8b5cf6', r: 4 }}
                      activeDot={{ r: 6, fill: '#8b5cf6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 3: Top Events + Department Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Events Table */}
        <motion.div variants={item}>
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                Top Events by Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-10 animate-pulse rounded bg-white/5" />
                  ))}
                </div>
              ) : topEvents.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">No events data</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="pb-2 text-left text-xs font-medium text-gray-500">Event</th>
                        <th className="pb-2 text-left text-xs font-medium text-gray-500">Category</th>
                        <th className="pb-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="pb-2 text-right text-xs font-medium text-gray-500">Regs</th>
                        <th className="pb-2 text-right text-xs font-medium text-gray-500">Fill</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topEvents.map((ev, i) => (
                        <motion.tr
                          key={ev.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-2.5 pr-3">
                            <span className="font-medium text-white truncate block max-w-[140px]">{ev.title}</span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              ev.category === 'CTF' ? 'bg-cyan-500/10 text-cyan-400' :
                              ev.category === 'WORKSHOP' ? 'bg-emerald-500/10 text-emerald-400' :
                              ev.category === 'SEMINAR' ? 'bg-amber-500/10 text-amber-400' :
                              ev.category === 'TRAINING' ? 'bg-red-500/10 text-red-400' :
                              'bg-violet-500/10 text-violet-400'
                            }`}>
                              {CATEGORY_LABELS[ev.category] || ev.category}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-gray-500 text-xs whitespace-nowrap">
                            {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-2.5 text-right">
                            <span className="text-emerald-400 font-medium">{ev.registrations}</span>
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/5">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                                  style={{ width: `${Math.min(ev.fillRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-gray-500 w-8 text-right">{ev.fillRate}%</span>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Department Distribution */}
        <motion.div variants={item}>
          <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-400" />
                Department Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[250px] animate-pulse rounded-lg bg-white/5" />
              ) : departmentDist.length === 0 ? (
                <div className="flex h-[250px] items-center justify-center text-gray-500 text-sm">No department data</div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, departmentDist.length * 40)}>
                  <BarChart data={departmentDist} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="#666" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#666" fontSize={11} width={100} tick={{ fill: '#9ca3af' }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                      {departmentDist.map((_, i) => (
                        <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
