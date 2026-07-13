'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Users, ShieldCheck, Crown, UserCog, PenTool,
  Banknote, Eye, UserCircle, UserX, CheckCircle, XCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/use-app-store';
import type { User, UserRole } from '@/types';
import { ROLE_LABELS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const canEditUserRole = (currentUser: User | null, targetUser: User) => {
  if (!currentUser) return false;
  if (targetUser.role === 'PLATFORM_ADMIN') return false;
  if (currentUser.role === 'PLATFORM_ADMIN') return true;
  if (currentUser.role === 'PRESIDENT') {
    return targetUser.role !== 'PRESIDENT';
  }
  return false;
};

const getAssignableRoles = (currentUser: User | null) => {
  if (!currentUser) return [];
  const allRoles = Object.entries(ROLE_LABELS);
  if (currentUser.role === 'PLATFORM_ADMIN') {
    return allRoles.filter(([k]) => k !== 'PLATFORM_ADMIN');
  }
  if (currentUser.role === 'PRESIDENT') {
    return allRoles.filter(([k]) => k !== 'PLATFORM_ADMIN' && k !== 'PRESIDENT');
  }
  return [];
};

const ROLE_CONFIG: Record<string, {
  icon: typeof Shield;
  color: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  description: string;
  dotColor: string;
}> = {
  PLATFORM_ADMIN: {
    icon: Shield,
    color: 'text-red-400',
    borderColor: 'border-l-red-400',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    description: 'Full system access with complete control over all features and settings',
    dotColor: 'fill-red-400',
  },
  PRESIDENT: {
    icon: Crown,
    color: 'text-amber-400',
    borderColor: 'border-l-amber-400',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    description: 'Club leadership with approval and oversight responsibilities',
    dotColor: 'fill-amber-400',
  },
  VP: {
    icon: UserCog,
    color: 'text-purple-400',
    borderColor: 'border-l-purple-400',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    description: 'Supports the president and assists with club operations',
    dotColor: 'fill-purple-400',
  },
  GS: {
    icon: PenTool,
    color: 'text-cyan-400',
    borderColor: 'border-l-cyan-400',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
    description: 'Manages communications, records, and expense approvals',
    dotColor: 'fill-cyan-400',
  },
  TREASURER: {
    icon: Banknote,
    color: 'text-emerald-400',
    borderColor: 'border-l-emerald-400',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    description: 'Handles finances, budgets, and payment verification',
    dotColor: 'fill-emerald-400',
  },
  MEDIA: {
    icon: Eye,
    color: 'text-pink-400',
    borderColor: 'border-l-pink-400',
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-400',
    description: 'Manages event creation and media content',
    dotColor: 'fill-pink-400',
  },
  VERIFIER: {
    icon: ShieldCheck,
    color: 'text-teal-400',
    borderColor: 'border-l-teal-400',
    iconBg: 'bg-teal-500/10',
    iconColor: 'text-teal-400',
    description: 'Verifies event attendance and payment submissions',
    dotColor: 'fill-teal-400',
  },
  MEMBER: {
    icon: UserCircle,
    color: 'text-blue-400',
    borderColor: 'border-l-blue-400',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    description: 'Standard member with event registration and profile access',
    dotColor: 'fill-blue-400',
  },
  GUEST: {
    icon: UserX,
    color: 'text-gray-400',
    borderColor: 'border-l-gray-400',
    iconBg: 'bg-gray-500/10',
    iconColor: 'text-gray-400',
    description: 'Limited access with view-only permissions',
    dotColor: 'fill-gray-400',
  },
};

const PERMISSION_MATRIX: { action: string; roles: Record<string, boolean> }[] = [
  { action: 'Full Control', roles: { PLATFORM_ADMIN: true, PRESIDENT: false, VP: false, GS: false, TREASURER: false, MEDIA: false, VERIFIER: false, MEMBER: false, GUEST: false } },
  { action: 'Assign Roles', roles: { PLATFORM_ADMIN: true, PRESIDENT: true, VP: false, GS: false, TREASURER: false, MEDIA: false, VERIFIER: false, MEMBER: false, GUEST: false } },
  { action: 'Create Event', roles: { PLATFORM_ADMIN: true, PRESIDENT: false, VP: false, GS: false, TREASURER: false, MEDIA: true, VERIFIER: false, MEMBER: false, GUEST: false } },
  { action: 'Add Budget', roles: { PLATFORM_ADMIN: true, PRESIDENT: true, VP: false, GS: false, TREASURER: true, MEDIA: false, VERIFIER: false, MEMBER: false, GUEST: false } },
  { action: 'Add Expense', roles: { PLATFORM_ADMIN: true, PRESIDENT: false, VP: false, GS: false, TREASURER: true, MEDIA: false, VERIFIER: false, MEMBER: false, GUEST: false } },
  { action: 'Approve Expense', roles: { PLATFORM_ADMIN: true, PRESIDENT: true, VP: false, GS: true, TREASURER: false, MEDIA: false, VERIFIER: false, MEMBER: false, GUEST: false } },
  { action: 'Verify Payment', roles: { PLATFORM_ADMIN: true, PRESIDENT: false, VP: false, GS: false, TREASURER: true, MEDIA: false, VERIFIER: true, MEMBER: false, GUEST: false } },
  { action: 'Register Event', roles: { PLATFORM_ADMIN: true, PRESIDENT: false, VP: false, GS: false, TREASURER: false, MEDIA: false, VERIFIER: true, MEMBER: true, GUEST: false } },
  { action: 'View Finance', roles: { PLATFORM_ADMIN: true, PRESIDENT: true, VP: false, GS: true, TREASURER: true, MEDIA: false, VERIFIER: false, MEMBER: false, GUEST: false } },
];

const SVG_PATTERN = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+`;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);
}

const AVATAR_GRADIENTS = [
  'from-emerald-500/30 to-cyan-500/30',
  'from-amber-500/30 to-orange-500/30',
  'from-purple-500/30 to-pink-500/30',
  'from-blue-500/30 to-indigo-500/30',
  'from-red-500/30 to-rose-500/30',
];

export function RolesPage() {
  const { currentUser } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(d => { if (d.success) setUsers(d.data.users || []); })
      .catch(() => {});
  }, []);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    if (!currentUser) return;
    try {
      const r = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, updatedBy: currentUser.id }),
      });
      const d = await r.json();
      if (d.success) setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (e) {
      console.error(e);
    }
  };

  // Role distribution data
  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(ROLE_LABELS).forEach(r => { counts[r] = 0; });
    users.forEach(u => { if (counts[u.role] !== undefined) counts[u.role]++; });
    return counts;
  }, [users]);

  const totalUsers = users.length;

  // Colors for pie chart segments
  const ROLE_COLORS: Record<string, string> = {
    PLATFORM_ADMIN: '#ef4444',
    PRESIDENT: '#f59e0b',
    VP: '#a855f7',
    GS: '#06b6d4',
    TREASURER: '#10b981',
    MEDIA: '#ec4899',
    VERIFIER: '#14b8a6',
    MEMBER: '#3b82f6',
    GUEST: '#6b7280',
  };

  // Compute SVG pie chart segments
  const pieSegments = useMemo(() => {
    const segments: { role: string; count: number; percentage: number; startAngle: number; endAngle: number }[] = [];
    let currentAngle = -90; // start at top
    const entries = Object.entries(roleDistribution).filter(([, count]) => count > 0);

    entries.forEach(([role, count]) => {
      const percentage = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
      const angle = (percentage / 100) * 360;
      segments.push({
        role,
        count,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
      });
      currentAngle += angle;
    });
    return segments;
  }, [roleDistribution, totalUsers]);

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  };

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  return (
    <div className="space-y-6">
      {/* Gradient Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/15 to-emerald-600/10 border border-emerald-500/10 p-6"
      >
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: `url("${SVG_PATTERN}")` }} />
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/20">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Role Management</h1>
            <p className="text-sm text-gray-400">Assign and manage member roles</p>
          </div>
        </div>
      </motion.div>

      {/* Role Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg text-white">Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Pie chart */}
              <div className="relative shrink-0">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  {pieSegments.map((seg, i) => (
                    <motion.path
                      key={seg.role}
                      d={describeArc(90, 90, 80, seg.startAngle, seg.endAngle)}
                      fill={ROLE_COLORS[seg.role] || '#6b7280'}
                      opacity={0.8}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 0.8, scale: 1 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      style={{ transformOrigin: '90px 90px' }}
                      stroke="#111"
                      strokeWidth="1"
                    />
                  ))}
                  {/* Center hole for donut effect */}
                  <circle cx="90" cy="90" r="45" fill="#111" />
                  <text x="90" y="85" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                    {totalUsers}
                  </text>
                  <text x="90" y="102" textAnchor="middle" fill="#6b7280" fontSize="10">
                    members
                  </text>
                </svg>
              </div>
              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 flex-1">
                {Object.entries(roleDistribution).map(([role, count]) => {
                  const config = ROLE_CONFIG[role];
                  if (count === 0) return null;
                  return (
                    <div key={role} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: ROLE_COLORS[role] || '#6b7280' }}
                      />
                      <span className="text-xs text-gray-400 truncate">{ROLE_LABELS[role as UserRole]}</span>
                      <span className="text-xs font-medium text-white ml-auto">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Role Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const config = ROLE_CONFIG[role];
          const RoleIcon = config.icon;
          const roleUsers = users.filter(u => u.role === role);
          const permissions = PERMISSION_MATRIX.filter(p => p.roles[role]).map(p => p.action);

          return (
            <motion.div key={role} variants={item} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
              <Card className={`border-white/5 border-l-2 ${config.borderColor} bg-[#111]/60 backdrop-blur transition-all hover:border-white/10 hover:shadow-lg hover:shadow-emerald-500/5`}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.iconBg}`}>
                      <RoleIcon className={`h-4 w-4 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white">{label}</h3>
                      <p className="text-xs text-gray-500">{roleUsers.length} member{roleUsers.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{config.description}</p>

                  {/* Member avatars */}
                  {roleUsers.length > 0 && (
                    <div className="flex items-center mb-3">
                      <div className="flex -space-x-2">
                        {roleUsers.slice(0, 4).map((u, idx) => (
                          <div
                            key={u.id}
                            className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} border-2 border-[#111] text-[9px] font-bold text-white`}
                            title={u.name}
                          >
                            {getInitials(u.name)}
                          </div>
                        ))}
                      </div>
                      {roleUsers.length > 4 && (
                        <span className="text-[10px] text-gray-500 ml-2">+{roleUsers.length - 4} more</span>
                      )}
                    </div>
                  )}

                  {/* Permissions list */}
                  {permissions.length > 0 && (
                    <div className="border-t border-white/5 pt-2">
                      <p className="text-[10px] text-gray-500 mb-1">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {permissions.map(p => (
                          <Badge key={p} variant="outline" className={`text-[9px] h-5 ${config.iconColor} border-current/20`}>
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* User Role Assignment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              User Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {users.map(user => {
                const config = ROLE_CONFIG[user.role] || ROLE_CONFIG.GUEST;
                const RoleIcon = config.icon;
                return (
                  <div key={user.id} className={`flex items-center gap-4 rounded-lg border border-white/5 border-l-2 ${config.borderColor} bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04]`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20`}>
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    {canEditUserRole(currentUser, user) ? (
                      <Select value={user.role} onValueChange={(v) => handleRoleChange(user.id, v as UserRole)}>
                        <SelectTrigger className="h-8 w-[150px] border-white/10 bg-white/5 text-xs text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#1a1a2e]">
                          {getAssignableRoles(currentUser).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="border-white/10 text-xs text-gray-400">
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Permission Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="border-white/5 bg-[#111]/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg text-white">Permission Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="py-2 pr-4 text-left text-gray-500 font-medium">Action</th>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <th key={k} className="px-2 py-2 text-center text-gray-500 font-medium whitespace-nowrap">{v}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_MATRIX.map(row => (
                    <tr key={row.action} className="border-b border-white/5">
                      <td className="py-2 pr-4 text-gray-400">{row.action}</td>
                      {Object.entries(ROLE_LABELS).map(([k]) => (
                        <td key={k} className="px-2 py-2 text-center">
                          {row.roles[k] ? (
                            <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-700 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
