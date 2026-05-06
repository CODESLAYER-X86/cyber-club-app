'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Hash, Building2, Phone, Edit3, Save, Calendar, Award, CreditCard } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import { ROLE_LABELS, MEMBERSHIP_STATUS_LABELS } from '@/types';
import { MembershipBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function ProfilePage() {
  const { currentUser } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: currentUser?.name || '', phone: currentUser?.phone || '', bio: '' });

  if (!currentUser) return <div className="py-16 text-center text-gray-500">Please sign in</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <Button onClick={() => setEditing(!editing)} variant="outline" className="border-emerald-500/20 text-emerald-400">
          {editing ? <><Save className="mr-2 h-4 w-4" />Save</> : <><Edit3 className="mr-2 h-4 w-4" />Edit</>}
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-3xl font-bold">{currentUser.name?.charAt(0) || '?'}</div>
              <div className="flex-1 space-y-4">
                <div>
                  {editing ? <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="border-white/10 bg-white/5 text-white text-xl font-bold" /> : <h2 className="text-2xl font-bold text-white">{currentUser.name}</h2>}
                  <p className="text-sm text-gray-500">{currentUser.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">{ROLE_LABELS[currentUser.role]}</Badge>
                  <MembershipBadge status={currentUser.membershipStatus} />
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-gray-500" /><div><p className="text-xs text-gray-600">Email</p><p className="text-sm text-white">{currentUser.email}</p></div></div>
              {currentUser.studentId && <div className="flex items-center gap-3"><Hash className="h-4 w-4 text-gray-500" /><div><p className="text-xs text-gray-600">Student ID</p><p className="text-sm text-white">{currentUser.studentId}</p></div></div>}
              {currentUser.department && <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-gray-500" /><div><p className="text-xs text-gray-600">Department</p><p className="text-sm text-white">{currentUser.department}</p></div></div>}
              <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-gray-500" /><div><p className="text-xs text-gray-600">Phone</p><p className="text-sm text-white">{currentUser.phone || 'Not set'}</p></div></div>
              <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-gray-500" /><div><p className="text-xs text-gray-600">Joined</p><p className="text-sm text-white">{new Date(currentUser.createdAt).toLocaleDateString()}</p></div></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardContent className="flex items-center gap-4 pt-6"><Calendar className="h-8 w-8 text-emerald-400" /><div><p className="text-2xl font-bold text-white">0</p><p className="text-xs text-gray-500">Events Attended</p></div></CardContent>
        </Card>
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardContent className="flex items-center gap-4 pt-6"><Award className="h-8 w-8 text-cyan-400" /><div><p className="text-2xl font-bold text-white">0</p><p className="text-xs text-gray-500">Certificates</p></div></CardContent>
        </Card>
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardContent className="flex items-center gap-4 pt-6"><CreditCard className="h-8 w-8 text-amber-400" /><div><p className="text-2xl font-bold text-white">0</p><p className="text-xs text-gray-500">Payments</p></div></CardContent>
        </Card>
      </div>
    </div>
  );
}
