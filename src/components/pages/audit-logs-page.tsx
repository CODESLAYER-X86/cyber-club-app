'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Search, CheckCircle, UserCheck, UserX, UserPlus, Wallet,
  XCircle, Plus, Activity, Users, Clock, Shield, ShieldAlert,
  CreditCard, Ban, ArrowRight, Eye, RefreshCw, Layers,
  Download, Megaphone, Trophy, Image as ImageIcon, Globe,
  Calendar, Database, Sparkles, Loader2,
} from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user?: {
    id?: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    transactionId?: string;
    studentId?: string;
    phone?: string;
  };
}

interface ActionMeta {
  label: string;
  icon: typeof FileText;
  color: string;
  borderColor: string;
  badgeClass: string;
  category: FilterTab;
}

type FilterTab = 'ALL' | 'MEMBERSHIP' | 'ROLES' | 'FINANCE' | 'SYSTEM';

const ACTION_MAP: Record<string, ActionMeta> = {
  // Membership Events
  MEMBERSHIP_APPLICATION: {
    label: 'Membership Application',
    icon: UserPlus,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    borderColor: 'border-l-sky-400',
    badgeClass: 'border-sky-500/30 text-sky-400 bg-sky-500/10',
    category: 'MEMBERSHIP',
  },
  MEMBER_APPROVE: {
    label: 'Membership Approved',
    icon: UserCheck,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    category: 'MEMBERSHIP',
  },
  MEMBER_REJECT: {
    label: 'Membership Rejected',
    icon: UserX,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    borderColor: 'border-l-rose-400',
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    category: 'MEMBERSHIP',
  },
  USER_REGISTERED: {
    label: 'Account Created',
    icon: Users,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    borderColor: 'border-l-cyan-400',
    badgeClass: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    category: 'MEMBERSHIP',
  },
  USER_KICKED: {
    label: 'Account Suspended',
    icon: UserX,
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
    borderColor: 'border-l-red-400',
    badgeClass: 'border-red-500/30 text-red-400 bg-red-500/10',
    category: 'MEMBERSHIP',
  },

  // Role & Permission Events
  ROLE_UPDATE: {
    label: 'Role Modified',
    icon: ShieldAlert,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    borderColor: 'border-l-indigo-400',
    badgeClass: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
    category: 'ROLES',
  },
  ROLE_ASSIGNED: {
    label: 'Role Assigned',
    icon: Shield,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    borderColor: 'border-l-indigo-400',
    badgeClass: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
    category: 'ROLES',
  },

  // Finance & Treasury Events
  PAYMENT_VERIFIED: {
    label: 'Payment Verified',
    icon: CheckCircle,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    category: 'FINANCE',
  },
  PAYMENT_REJECTED: {
    label: 'Payment Rejected',
    icon: Ban,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    borderColor: 'border-l-rose-400',
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    category: 'FINANCE',
  },
  PAYMENT_RECONCILED: {
    label: 'Payment Reconciled',
    icon: CreditCard,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    borderColor: 'border-l-cyan-400',
    badgeClass: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    category: 'FINANCE',
  },
  EXPENSE_CREATED: {
    label: 'Expense Submitted',
    icon: Wallet,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    borderColor: 'border-l-amber-400',
    badgeClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    category: 'FINANCE',
  },
  EXPENSE_APPROVED: {
    label: 'Expense Approved',
    icon: CheckCircle,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    category: 'FINANCE',
  },
  EXPENSE_REJECTED: {
    label: 'Expense Rejected',
    icon: XCircle,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    borderColor: 'border-l-rose-400',
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    category: 'FINANCE',
  },
  TREASURY_DEPOSIT_CREATED: {
    label: 'Treasury Deposit Added',
    icon: Wallet,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    category: 'FINANCE',
  },
  TREASURY_DEPOSIT_APPROVED: {
    label: 'Treasury Deposit Approved',
    icon: CheckCircle,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    category: 'FINANCE',
  },

  // System & Event Events
  EVENT_CREATED: {
    label: 'Event Published',
    icon: Plus,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    borderColor: 'border-l-cyan-400',
    badgeClass: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    category: 'SYSTEM',
  },
  EVENT_UPDATED: {
    label: 'Event Updated',
    icon: RefreshCw,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    borderColor: 'border-l-amber-400',
    badgeClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    category: 'SYSTEM',
  },
  EVENT_DELETED: {
    label: 'Event Deleted',
    icon: XCircle,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    borderColor: 'border-l-rose-400',
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    category: 'SYSTEM',
  },
  CONFIG_UPDATED: {
    label: 'Config Changed',
    icon: Shield,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    borderColor: 'border-l-amber-400',
    badgeClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    category: 'SYSTEM',
  },

  // Data Export Events
  DATA_EXPORTED: {
    label: 'Data Exported',
    icon: Download,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    borderColor: 'border-l-amber-400',
    badgeClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    category: 'SYSTEM',
  },

  // Announcement Events
  ANNOUNCEMENT_CREATED: {
    label: 'Announcement Published',
    icon: Megaphone,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    borderColor: 'border-l-sky-400',
    badgeClass: 'border-sky-500/30 text-sky-400 bg-sky-500/10',
    category: 'SYSTEM',
  },
  ANNOUNCEMENT_DELETED: {
    label: 'Announcement Deleted',
    icon: XCircle,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    borderColor: 'border-l-rose-400',
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    category: 'SYSTEM',
  },

  // Committee Events (category: ROLES)
  COMMITTEE_MEMBER_ADDED: {
    label: 'Committee Appointed',
    icon: UserPlus,
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    borderColor: 'border-l-teal-400',
    badgeClass: 'border-teal-500/30 text-teal-400 bg-teal-500/10',
    category: 'ROLES',
  },
  COMMITTEE_MEMBER_UPDATED: {
    label: 'Committee Updated',
    icon: RefreshCw,
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    borderColor: 'border-l-teal-400',
    badgeClass: 'border-teal-500/30 text-teal-400 bg-teal-500/10',
    category: 'ROLES',
  },
  COMMITTEE_MEMBER_REMOVED: {
    label: 'Committee Removed',
    icon: UserX,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    borderColor: 'border-l-rose-400',
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    category: 'ROLES',
  },

  // Achievement Events
  ACHIEVEMENT_SUBMITTED: {
    label: 'Achievement Submitted',
    icon: Trophy,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    borderColor: 'border-l-amber-400',
    badgeClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    category: 'SYSTEM',
  },
  ACHIEVEMENT_APPROVED: {
    label: 'Achievement Approved',
    icon: CheckCircle,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    category: 'SYSTEM',
  },
  ACHIEVEMENT_REJECTED: {
    label: 'Achievement Rejected',
    icon: XCircle,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    borderColor: 'border-l-rose-400',
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    category: 'SYSTEM',
  },
  ACHIEVEMENT_DELETED: {
    label: 'Achievement Deleted',
    icon: XCircle,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    borderColor: 'border-l-rose-400',
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    category: 'SYSTEM',
  },

  // Gallery Events
  GALLERY_PHOTO_ADDED: {
    label: 'Gallery Photo Added',
    icon: ImageIcon,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    borderColor: 'border-l-cyan-400',
    badgeClass: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    category: 'SYSTEM',
  },
  GALLERY_PHOTO_DELETED: {
    label: 'Gallery Photo Deleted',
    icon: XCircle,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    borderColor: 'border-l-rose-400',
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    category: 'SYSTEM',
  },

  // Sponsor Events
  SPONSOR_CREATED: {
    label: 'Sponsor Added',
    icon: Globe,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    borderColor: 'border-l-emerald-400',
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    category: 'SYSTEM',
  },
  SPONSOR_UPDATED: {
    label: 'Sponsor Updated',
    icon: RefreshCw,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    borderColor: 'border-l-amber-400',
    badgeClass: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    category: 'SYSTEM',
  },
  SPONSOR_DELETED: {
    label: 'Sponsor Deleted',
    icon: XCircle,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    borderColor: 'border-l-rose-400',
    badgeClass: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    category: 'SYSTEM',
  },
};

const FILTER_TABS: { key: FilterTab; label: string; icon: typeof Layers }[] = [
  { key: 'ALL', label: 'All Activities', icon: Layers },
  { key: 'MEMBERSHIP', label: 'Membership', icon: UserCheck },
  { key: 'ROLES', label: 'Roles & Access', icon: Shield },
  { key: 'FINANCE', label: 'Finance & Treasury', icon: Wallet },
  { key: 'SYSTEM', label: 'System & Events', icon: Activity },
];

const ROLE_BADGE_STYLES: Record<string, string> = {
  PRESIDENT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  VP: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  GS: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  TREASURER: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  MEDIA: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  VERIFIER: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PLATFORM_ADMIN: 'bg-red-500/15 text-red-400 border-red-500/30',
  MEMBER: 'bg-white/10 text-gray-300 border-white/10',
  GUEST: 'bg-gray-800 text-gray-400 border-gray-700',
};

function getActionMeta(action: string): ActionMeta {
  if (ACTION_MAP[action]) return ACTION_MAP[action];

  if (action.includes('MEMBER') || action.includes('USER')) {
    return {
      label: action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      icon: Users,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      borderColor: 'border-l-sky-400',
      badgeClass: 'border-sky-500/30 text-sky-400 bg-sky-500/10',
      category: 'MEMBERSHIP',
    };
  }

  if (action.includes('PAYMENT') || action.includes('EXPENSE') || action.includes('TREASURY')) {
    return {
      label: action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      icon: Wallet,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      borderColor: 'border-l-emerald-400',
      badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      category: 'FINANCE',
    };
  }

  if (action.includes('ROLE')) {
    return {
      label: action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      icon: Shield,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      borderColor: 'border-l-indigo-400',
      badgeClass: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
      category: 'ROLES',
    };
  }

  return {
    label: action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    icon: FileText,
    color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    borderColor: 'border-l-gray-400',
    badgeClass: 'border-white/10 text-gray-400 bg-white/5',
    category: 'SYSTEM',
  };
}

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
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function formatFullDate(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Parses raw audit string into human readable story elements with styled badges.
 */
function renderHumanNarrative(action: string, details: string, user?: AuditLogEntry['user']) {
  // Case 1: Role Update
  // Format: Changed role of Name (email) from OLD to NEW
  const roleMatch = details.match(/Changed role of (.*?) \((.*?)\) from (\w+) to (\w+)/i);
  if (roleMatch) {
    const [, targetName, targetEmail, oldRole, newRole] = roleMatch;
    return (
      <div className="text-xs text-gray-300 flex items-center gap-1.5 flex-wrap">
        <span>Changed role of</span>
        <span className="font-semibold text-white bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{targetName}</span>
        <span className="text-gray-500 text-[11px]">({targetEmail})</span>
        <span>from</span>
        <Badge variant="outline" className={`text-[10px] uppercase font-mono ${ROLE_BADGE_STYLES[oldRole] || 'border-white/10 text-gray-400'}`}>
          {oldRole}
        </Badge>
        <ArrowRight className="h-3 w-3 text-gray-500" />
        <Badge variant="outline" className={`text-[10px] uppercase font-mono font-bold ${ROLE_BADGE_STYLES[newRole] || 'border-indigo-500/30 text-indigo-400'}`}>
          {newRole}
        </Badge>
      </div>
    );
  }

  // Case 2: Membership Rejection
  // Format: Rejected membership for user Name (email)
  const rejectMatch = details.match(/Rejected membership for user (.*?) \((.*?)\)/i);
  if (rejectMatch) {
    const [, targetName, targetEmail] = rejectMatch;
    const studentIdMatch = details.match(/\[Student ID:\s*([A-Za-z0-9_-]+)\]/i)?.[1];
    return (
      <div className="text-xs text-gray-300 flex items-center gap-1.5 flex-wrap">
        <span className="text-rose-400 font-medium">Declined membership</span>
        <span>for applicant</span>
        <span className="font-semibold text-white bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 text-rose-200">{targetName}</span>
        <span className="text-gray-500 text-[11px]">({targetEmail})</span>
        {studentIdMatch && (
          <span className="font-mono text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
            ID: {studentIdMatch}
          </span>
        )}
      </div>
    );
  }

  // Case 3: Membership Approval
  // Format: Approved membership for user Name (email)
  const approveMatch = details.match(/Approved membership for user (.*?) \((.*?)\)/i);
  if (approveMatch) {
    const [, targetName, targetEmail] = approveMatch;
    const studentIdMatch = details.match(/\[Student ID:\s*([A-Za-z0-9_-]+)\]/i)?.[1];
    const trxIdMatch = details.match(/\[Trx ID:\s*([A-Za-z0-9_-]+)\]/i)?.[1];
    return (
      <div className="text-xs text-gray-300 flex items-center gap-1.5 flex-wrap">
        <span className="text-emerald-400 font-medium">Granted membership</span>
        <span>to</span>
        <span className="font-semibold text-white bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-emerald-200">{targetName}</span>
        <span className="text-gray-500 text-[11px]">({targetEmail})</span>
        {studentIdMatch && (
          <span className="font-mono text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
            ID: {studentIdMatch}
          </span>
        )}
        {trxIdMatch && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <CreditCard className="h-2.5 w-2.5" />
            Trx: {trxIdMatch}
          </span>
        )}
      </div>
    );
  }

  // Case 4: Membership Application
  if (action === 'MEMBERSHIP_APPLICATION') {
    const isReapply = details.toLowerCase().includes('re-submitted') || details.toLowerCase().includes('prior rejection');
    
    // Extract transaction ID from details string or fallback to user.transactionId
    const trxMatch = details.match(/(?:Trx ID|Ref\/Trx|Transaction ID):\s*([A-Za-z0-9_-]+)/i);
    const trxId = trxMatch ? trxMatch[1] : user?.transactionId;

    return (
      <div className="text-xs text-gray-300 flex items-center gap-2 flex-wrap">
        {isReapply ? (
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px]">
            Revised Application
          </Badge>
        ) : (
          <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-300 text-[10px]">
            New Applicant
          </Badge>
        )}
        <span>Candidate submitted membership application</span>
        {trxId && (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shadow-sm">
            <CreditCard className="h-3 w-3 text-emerald-400" />
            Trx ID: <span className="font-bold text-white tracking-wider">{trxId}</span>
          </span>
        )}
      </div>
    );
  }

  // Case 5: Payment verification / approval
  const paymentMatch = details.match(/(Verified|Approved|Rejected) payment of ([^ ]+) from (.*?) \((.*?)\)(?:\.\s*Transaction ID:\s*([A-Za-z0-9_-]+))?/i);
  if (paymentMatch) {
    const [, statusWord, amount, targetName, targetEmail, trxId] = paymentMatch;
    const isApproved = statusWord.toLowerCase() === 'verified' || statusWord.toLowerCase() === 'approved';
    return (
      <div className="text-xs text-gray-300 flex items-center gap-1.5 flex-wrap">
        <span className={isApproved ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
          {statusWord} payment of ৳{amount}
        </span>
        <span>from</span>
        <span className="font-semibold text-white bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{targetName}</span>
        <span className="text-gray-500 text-[11px]">({targetEmail})</span>
        {trxId && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <CreditCard className="h-2.5 w-2.5" />
            TxID: {trxId}
          </span>
        )}
      </div>
    );
  }

  // Fallback for general text
  return (
    <p className="text-xs text-gray-300 leading-relaxed font-sans">{details}</p>
  );
}

function getDateGroupKey(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const logDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.round((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  if (now.getFullYear() === date.getFullYear()) {
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const PAGE_SIZE = 50;

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Debounce search input by 300ms to preserve serverless bandwidth
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch logs with cursor and server-side filters
  const fetchLogs = async (isRefresh = false, cursorToUse?: string | null) => {
    const isNextPage = Boolean(cursorToUse);

    if (isNextPage) {
      setLoadingMore(true);
    } else if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('limit', PAGE_SIZE.toString());
      if (activeFilter !== 'ALL') {
        params.set('category', activeFilter);
      }
      if (debouncedSearch.trim()) {
        params.set('q', debouncedSearch.trim());
      }
      if (cursorToUse) {
        params.set('cursor', cursorToUse);
      }

      const r = await fetch(`/api/audit-logs?${params.toString()}`);
      const d = await r.json();

      if (d.success) {
        const newLogs: AuditLogEntry[] = d.data.auditLogs || [];
        if (isNextPage) {
          setLogs(prev => [...prev, ...newLogs]);
        } else {
          setLogs(newLogs);
        }
        setNextCursor(d.data.nextCursor || null);
        setHasMore(Boolean(d.data.hasMore));
        if (typeof d.data.total === 'number') setTotalCount(d.data.total);
        if (typeof d.data.todayCount === 'number') setTodayCount(d.data.todayCount);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeFilter, debouncedSearch]);

  const handlePruneLogs = async () => {
    if (!confirm('Run 100k FIFO maintenance check now? Any logs older than the 100,000th newest record will be purged to protect Supabase free tier storage.')) {
      return;
    }
    setPruning(true);
    try {
      const res = await fetch('/api/audit-logs', { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        alert(d.data.message || 'Pruning completed');
        fetchLogs(true);
      } else {
        alert(d.error?.message || 'Pruning failed');
      }
    } catch (err) {
      console.error('Prune request failed:', err);
    } finally {
      setPruning(false);
    }
  };

  // Group logs chronologically into timeline dates
  const groupedLogs = useMemo(() => {
    const groups: { dateKey: string; logs: AuditLogEntry[] }[] = [];
    const map = new Map<string, AuditLogEntry[]>();

    for (const log of logs) {
      const key = getDateGroupKey(log.createdAt);
      if (!map.has(key)) {
        map.set(key, []);
        groups.push({ dateKey: key, logs: map.get(key)! });
      }
      map.get(key)!.push(log);
    }

    return groups;
  }, [logs]);

  const uniqueUsers = useMemo(() => {
    return new Set(logs.map(l => l.user?.email).filter(Boolean)).size;
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Gradient Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0A101D] to-cyan-950/30 border border-emerald-500/20 p-6 shadow-xl"
      >
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 shadow-inner">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight font-mono">Audit Logs Timeline</h1>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                  Tamper-Proof Trail
                </Badge>
                <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[10px] font-mono">
                  100k FIFO Cap
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Chronological security ledger with server-side query filtering and automatic 100k free-tier retention.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePruneLogs}
              disabled={pruning || loading}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-xs"
              title="Ensure log count stays within 100,000 free-tier limit"
            >
              <Database className={`mr-1.5 h-3.5 w-3.5 text-cyan-400 ${pruning ? 'animate-spin' : ''}`} />
              Prune Check
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(true)}
              disabled={refreshing || loading}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-xs"
            >
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Trail
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          icon={Activity}
          label="Total Records in DB"
          value={totalCount > 0 ? totalCount.toLocaleString() : logs.length.toString()}
          delay={0}
        />
        <StatCard
          icon={Clock}
          label="Today's Executive Actions"
          value={todayCount.toString()}
          trend={todayCount > 0 ? 'up' : 'neutral'}
          delay={0.05}
        />
        <StatCard
          icon={Users}
          label="Active Actors in View"
          value={uniqueUsers.toString()}
          delay={0.1}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/5 pt-1">
        {FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.key;
          const TabIcon = tab.icon;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveFilter(tab.key);
              }}
              className={`shrink-0 flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all border ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                  : 'bg-white/[0.02] text-gray-400 border-white/5 hover:bg-white/5 hover:text-white'
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {isActive && (
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-emerald-500/30 text-emerald-200">
                  {totalCount.toLocaleString()}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Server-side search by actor name, student ID, TxID, role, action, or details..."
          className="border-white/10 bg-[#0c1017] pl-10 pr-20 text-white placeholder:text-gray-500 text-xs font-sans focus-visible:ring-emerald-500/40"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && !loadingMore && (
            <Loader2 className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
          )}
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-gray-400 hover:text-white text-xs font-mono"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="space-y-4 py-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-white/5 border border-white/5 animate-pulse shrink-0" />
              <div className="flex-1 h-20 animate-pulse rounded-lg bg-white/5 border border-white/5" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-white/10 bg-[#0b0f15]"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-3">
            <FileText className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-300">No matching audit logs</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1">
            Try adjusting your search terms or select another category filter above.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {groupedLogs.map(group => (
            <div key={group.dateKey} className="space-y-3">
              {/* Sticky Date Group Header */}
              <div className="sticky top-2 z-10 flex items-center gap-2 py-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#0c121d] border border-emerald-500/25 text-emerald-400 shadow-md backdrop-blur-md">
                  <Calendar className="h-3 w-3 text-emerald-400" />
                  {group.dateKey}
                  <span className="text-[10px] text-gray-500 font-normal">
                    • {group.logs.length} {group.logs.length === 1 ? 'event' : 'events'}
                  </span>
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/20 via-white/5 to-transparent" />
              </div>

              {/* Vertical Timeline Spine */}
              <div className="relative pl-6 sm:pl-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/40 before:via-white/10 before:to-white/5 space-y-3">
                {group.logs.map(log => {
                  const meta = getActionMeta(log.action);
                  const ActionIcon = meta.icon;
                  const actorName = log.user?.name || 'System Auto';
                  const actorRole = log.user?.role || 'SYSTEM';

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="relative"
                    >
                      {/* Timeline Node on the Spine */}
                      <div className={`absolute -left-6 sm:-left-8 top-3.5 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border bg-[#0b0f17] shadow-sm z-0 ${meta.badgeClass}`}>
                        <ActionIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </div>

                      {/* Card Content */}
                      <Card
                        onClick={() => setSelectedLog(log)}
                        className={`cursor-pointer group border-white/5 border-l-4 ${meta.borderColor} bg-[#0c1017] hover:bg-[#111722] transition-all hover:border-white/10 hover:shadow-lg hover:shadow-black/40`}
                      >
                        <CardContent className="p-3.5 sm:p-4 flex items-start sm:items-center gap-3.5">
                          {/* Semantic Action Icon */}
                          <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border ${meta.color}`}>
                            <ActionIcon className="h-5 w-5" />
                          </div>

                          {/* Main Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            {/* Top Row: Human Action Badge + Technical Tag + Actor Info */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white tracking-tight">
                                {meta.label}
                              </span>

                              <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                {log.action}
                              </span>

                              <span className="text-gray-600 text-xs hidden sm:inline">•</span>

                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <span className="text-gray-500 text-[11px]">by</span>
                                <span className="font-semibold text-gray-200">{actorName}</span>
                                {actorRole && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] px-1.5 py-0 font-mono ${ROLE_BADGE_STYLES[actorRole] || 'border-white/10 text-gray-400'}`}
                                  >
                                    {actorRole}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Bottom Row: Human Story Narrative */}
                            <div className="pt-0.5">
                              {renderHumanNarrative(log.action, log.details, log.user)}
                            </div>
                          </div>

                          {/* Timestamp & Inspect Action */}
                          <div className="shrink-0 flex flex-col items-end justify-center text-right pl-2">
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono group-hover:text-emerald-400 transition-colors">
                              <Clock className="h-3 w-3 text-gray-500" />
                              <span>{timeAgo(log.createdAt)}</span>
                            </div>
                            <span className="text-[10px] text-gray-600 hidden sm:block mt-1">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load Earlier Events or Reached Beginning */}
          <div className="flex flex-col items-center justify-center pt-4 pb-2 gap-2">
            {hasMore ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(false, nextCursor)}
                disabled={loadingMore}
                className="border-white/10 bg-[#0c1017] text-gray-300 hover:bg-white/5 hover:text-white font-mono text-xs px-6 py-2 shadow-md hover:border-emerald-500/30"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-emerald-400" />
                    Fetching Earlier Logs...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-3.5 w-3.5 text-emerald-400" />
                    Load Earlier Events ({logs.length} of {totalCount.toLocaleString()} loaded)
                  </>
                )}
              </Button>
            ) : logs.length > 0 ? (
              <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono py-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>Beginning of recorded timeline reached • All {logs.length} matching events displayed</span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Log Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="bg-[#0f141c] border-white/10 text-white sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {selectedLog && (
                <Badge variant="outline" className={getActionMeta(selectedLog.action).badgeClass}>
                  {getActionMeta(selectedLog.action).label}
                </Badge>
              )}
              <span className="text-xs font-mono text-gray-400">{selectedLog?.action}</span>
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Audit Record Inspection
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Cryptographically verified audit trail entry stored in club security archives.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (() => {
            const isApplicantSelfAction = ['MEMBERSHIP_APPLICATION', 'EVENT_REGISTRATION', 'PAYMENT_SUBMIT'].includes(selectedLog.action);

            // Extract potential target subject details from details string
            const targetUserMatch = selectedLog.details.match(/(?:membership for user|payment of [^from]*from|role of|deleted user|demoted)\s+([^(\n]+?)\s+\(([^)\n]+)\)/i);
            const targetName = targetUserMatch?.[1]?.trim();
            const targetEmail = targetUserMatch?.[2]?.trim();

            const targetStudentId = selectedLog.details.match(/(?:\[Student ID:\s*|Student ID:\s*)([A-Za-z0-9_-]+)\]?/i)?.[1];
            const targetTrxId = selectedLog.details.match(/(?:\[Trx ID:\s*|Trx ID:\s*|Ref\/Trx:\s*|Transaction ID:\s*)([A-Za-z0-9_-]+)\]?/i)?.[1];
            const targetPhone = selectedLog.details.match(/(?:\[Phone:\s*|Phone:\s*)([A-Za-z0-9_+-]+)\]?/i)?.[1];

            // For applicant self actions, actor IS the applicant
            const applicantTrxId = selectedLog.details.match(/(?:Trx ID|Ref\/Trx|Transaction ID):\s*([A-Za-z0-9_-]+)/i)?.[1] || selectedLog.user?.transactionId;
            const applicantStudentId = selectedLog.user?.studentId;
            const applicantPhone = selectedLog.user?.phone;

            return (
              <div className="space-y-4 pt-2 text-xs">
                {/* Authorized Actor / Performed By Section */}
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-gray-500 font-mono">
                      {isApplicantSelfAction ? 'Applicant / Initiator' : 'Authorized Actor'}
                    </span>
                    <Badge variant="outline" className={ROLE_BADGE_STYLES[selectedLog.user?.role || 'SYSTEM']}>
                      {selectedLog.user?.role || 'SYSTEM'}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{selectedLog.user?.name || 'System Engine'}</p>
                    <p className="text-gray-400 text-xs">{selectedLog.user?.email || 'automated@cybersecdiu.club'}</p>
                  </div>
                </div>

                {/* Candidate Credentials Section (Only for applicant self actions) */}
                {isApplicantSelfAction && (applicantTrxId || applicantStudentId || applicantPhone) && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-mono font-semibold flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5" />
                        Payment & Student Reference
                      </span>
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-mono text-[10px]">
                        Application Record
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {applicantTrxId && (
                        <div className="bg-black/40 rounded p-2 border border-white/5">
                          <span className="text-gray-400 text-[10px] uppercase font-mono block">Transaction ID</span>
                          <span className="font-mono text-emerald-400 font-bold text-xs select-all">
                            {applicantTrxId}
                          </span>
                        </div>
                      )}
                      {applicantStudentId && (
                        <div className="bg-black/40 rounded p-2 border border-white/5">
                          <span className="text-gray-400 text-[10px] uppercase font-mono block">Student ID</span>
                          <span className="font-mono text-gray-200 text-xs select-all">
                            {applicantStudentId}
                          </span>
                        </div>
                      )}
                      {applicantPhone && (
                        <div className="bg-black/40 rounded p-2 border border-white/5">
                          <span className="text-gray-400 text-[10px] uppercase font-mono block">Phone</span>
                          <span className="font-mono text-gray-200 text-xs">
                            {applicantPhone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Target Subject / Member Record (For administrative actions) */}
                {!isApplicantSelfAction && (targetName || targetEmail || targetTrxId || targetStudentId || targetPhone) && (
                  <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-sky-400 font-mono font-semibold flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Target Member / Subject Record
                      </span>
                      <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-300 font-mono text-[10px]">
                        Subject
                      </Badge>
                    </div>
                    {targetName && (
                      <div className="bg-black/40 rounded p-2 border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white text-xs">{targetName}</p>
                          {targetEmail && <p className="text-gray-400 text-[11px] font-mono">{targetEmail}</p>}
                        </div>
                      </div>
                    )}
                    {(targetTrxId || targetStudentId || targetPhone) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {targetTrxId && (
                          <div className="bg-black/40 rounded p-2 border border-white/5">
                            <span className="text-gray-400 text-[10px] uppercase font-mono block">Transaction ID</span>
                            <span className="font-mono text-emerald-400 font-bold text-xs select-all">
                              {targetTrxId}
                            </span>
                          </div>
                        )}
                        {targetStudentId && (
                          <div className="bg-black/40 rounded p-2 border border-white/5">
                            <span className="text-gray-400 text-[10px] uppercase font-mono block">Student ID</span>
                            <span className="font-mono text-gray-200 text-xs select-all">
                              {targetStudentId}
                            </span>
                          </div>
                        )}
                        {targetPhone && (
                          <div className="bg-black/40 rounded p-2 border border-white/5">
                            <span className="text-gray-400 text-[10px] uppercase font-mono block">Phone</span>
                            <span className="font-mono text-gray-200 text-xs">
                              {targetPhone}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Event Description */}
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-gray-500 font-mono">Action Story</span>
                  <div className="py-1">
                    {renderHumanNarrative(selectedLog.action, selectedLog.details, selectedLog.user)}
                  </div>
                  <div className="pt-2 border-t border-white/5 text-[11px] text-gray-500 font-mono break-all">
                    Raw Details: {selectedLog.details}
                  </div>
                </div>

                {/* Timestamp & Metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono block mb-1">Exact Time</span>
                    <span className="text-gray-200 font-mono text-[11px] block">{formatFullDate(selectedLog.createdAt)}</span>
                    <span className="text-gray-500 text-[10px]">({timeAgo(selectedLog.createdAt)})</span>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono block mb-1">Audit Record ID</span>
                    <span className="text-gray-400 font-mono text-[10px] block truncate">{selectedLog.id}</span>
                    <span className="text-emerald-400 text-[10px] flex items-center gap-1 mt-0.5">
                      <CheckCircle className="h-3 w-3" /> Verified Immutable
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
