'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444'];

export function AnalyticsPage() {
  const { currentUser } = useAppStore();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { if (d.success) setStats(d.data); }).catch(() => {});
  }, []);

  const memberGrowth = [
    { month: 'Jan', members: 80 }, { month: 'Feb', members: 95 }, { month: 'Mar', members: 110 },
    { month: 'Apr', members: 120 }, { month: 'May', members: 135 }, { month: 'Jun', members: stats?.totalMembers || 150 },
  ];

  const eventParticipation = [
    { name: 'Workshops', value: 35 }, { name: 'CTF', value: 25 }, { name: 'Seminars', value: 20 }, { name: 'Meetups', value: 15 }, { name: 'Training', value: 5 },
  ];

  const monthlyRevenue = [
    { month: 'Jan', revenue: 5000 }, { month: 'Feb', revenue: 7500 }, { month: 'Mar', revenue: 12000 },
    { month: 'Apr', revenue: 8000 }, { month: 'May', revenue: 15000 }, { month: 'Jun', revenue: stats?.totalFunds || 20000 },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Analytics</h1><p className="text-sm text-gray-500">Club performance insights and trends</p></div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Member Growth */}
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-400" />Member Growth</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={memberGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="members" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Event Category Distribution */}
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><Calendar className="h-5 w-5 text-cyan-400" />Event Categories</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={eventParticipation} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {eventParticipation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {eventParticipation.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} /><span className="text-gray-400">{item.name}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur lg:col-span-2">
          <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><BarChart3 className="h-5 w-5 text-amber-400" />Revenue Overview</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
