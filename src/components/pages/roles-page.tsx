'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users } from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { User, UserRole } from '@/types';
import { ROLE_LABELS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

const PERMISSION_MATRIX: { action: string; roles: Record<string, boolean> }[] = [
  { action: 'Full Control', roles: { PLATFORM_ADMIN: true, PRESIDENT: false, VP: false, GS: false, TREASURER: false, MEDIA: false, VERIFIER: false, MEMBER: false, GUEST: false } },
  { action: 'Assign Roles', roles: { PLATFORM_ADMIN: true, PRESIDENT: true, VP: false, GS: false, TREASURER: false, MEDIA: false, VERIFIER: false, MEMBER: false, GUEST: false } },
  { action: 'Create Event', roles: { PLATFORM_ADMIN: true, PRESIDENT: false, VP: false, GS: false, TREASURER: false, MEDIA: true, VERIFIER: false, MEMBER: false, GUEST: false } },
  { action: 'Add Budget', roles: { PLATFORM_ADMIN: true, PRESIDENT: true, VP: false, GS: false, TREASURER: true, MEDIA: false, VERIFIER: false, MEMBER: false, GUEST: false } },
  { action: 'Add Expense', roles: { PLATFORM_ADMIN: true, PRESIDENT: false, VP: false, GS: false, TREASURER: true, MEDIA: false, VERIFIER: false, MEMBER: false, GUEST: false } },
  { action: 'Approve Expense', roles: { PLATFORM_ADMIN: true, PRESIDENT: true, VP: false, GS: true, TREASURER: false, MEDIA: false, VERIFIER: false, MEMBER: false, GUEST: false } },
  { action: 'Verify Payment', roles: { PLATFORM_ADMIN: true, PRESIDENT: false, VP: false, GS: false, TREASURER: true, MEDIA: false, VERIFIER: true, MEMBER: false, GUEST: false } },
  { action: 'Register Event', roles: { PLATFORM_ADMIN: true, PRESIDENT: false, VP: false, GS: false, TREASURER: false, MEDIA: false, VERIFIER: false, MEMBER: true, GUEST: false } },
  { action: 'View Finance', roles: { PLATFORM_ADMIN: true, PRESIDENT: true, VP: false, GS: true, TREASURER: true, MEDIA: false, VERIFIER: false, MEMBER: false, GUEST: false } },
];

export function RolesPage() {
  const { currentUser } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => { if (d.success) setUsers(d.data.users || []); }).catch(() => {});
  }, []);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    if (!currentUser) return;
    try {
      const r = await fetch(`/api/users/${userId}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, updatedBy: currentUser.id }) });
      const d = await r.json(); if (d.success) setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Role Management</h1><p className="text-sm text-gray-500">Assign roles and manage permissions</p></div>

      {/* User Role Assignment */}
      <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
        <CardHeader><CardTitle className="text-lg text-white">User Roles</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {users.map(user => (
              <div key={user.id} className="flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">{user.name?.charAt(0)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div>
                <Select value={user.role} onValueChange={(v) => handleRoleChange(user.id, v as UserRole)}>
                  <SelectTrigger className="h-8 w-[150px] border-white/10 bg-white/5 text-xs text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#1a1a2e]">{Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
        <CardHeader><CardTitle className="text-lg text-white">Permission Matrix</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-2 pr-4 text-left text-gray-500 font-medium">Action</th>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <th key={k} className="px-2 py-2 text-center text-gray-500 font-medium whitespace-nowrap">{v}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MATRIX.map(row => (
                  <tr key={row.action} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-gray-400">{row.action}</td>
                    {Object.entries(ROLE_LABELS).map(([k]) => (
                      <td key={k} className="px-2 py-2 text-center">
                        {row.roles[k] ? <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto" /> : <XCircle className="h-4 w-4 text-gray-700 mx-auto" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
