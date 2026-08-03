'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  MembershipStatus,
  PaymentStatus,
  EventStatus,
  RegistrationStatus,
  CertificateType,
  CertificateStatus,
  ExpenseStatus,
} from '@/types';

// ──────────────────────────────────────────
// Color config per status/type
// ──────────────────────────────────────────

const MEMBERSHIP_COLORS: Record<MembershipStatus, string> = {
  NON_MEMBER: 'bg-gray-500/15 text-gray-400 border-gray-500/20 hover:bg-gray-500/20',
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/20',
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  VERIFIED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/20',
};

const EVENT_COLORS: Record<EventStatus, string> = {
  UPCOMING: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
  ONGOING: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  COMPLETED: 'bg-gray-500/15 text-gray-400 border-gray-500/20 hover:bg-gray-500/20',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/20',
};

const REGISTRATION_COLORS: Record<RegistrationStatus, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/20',
  CANCELLED: 'bg-gray-500/15 text-gray-400 border-gray-500/20 hover:bg-gray-500/20',
};

const CERTIFICATE_TYPE_COLORS: Record<CertificateType, string> = {
  PARTICIPATION: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
  ACHIEVEMENT: 'bg-blue-500/15 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
  EXCELLENCE: 'bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  WINNER: 'bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  FIRST_PLACE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  SECOND_PLACE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  THIRD_PLACE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  ORGANIZER: 'bg-purple-500/15 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
  VOLUNTEER: 'bg-purple-500/15 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
  JUDGE: 'bg-purple-500/15 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
  APPRECIATION: 'bg-sky-500/15 text-sky-400 border-sky-500/20 hover:bg-sky-500/20',
  CUSTOM: 'bg-gray-500/15 text-gray-400 border-gray-500/20 hover:bg-gray-500/20',
};

const CERTIFICATE_STATUS_COLORS: Record<CertificateStatus, string> = {
  REGISTERED: 'bg-gray-500/15 text-gray-400 border-gray-500/20 hover:bg-gray-500/20',
  PRESENT: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20',
  ELIGIBLE: 'bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  AUTHORIZED: 'bg-sky-500/15 text-sky-400 border-sky-500/20 hover:bg-sky-500/20',
  GENERATED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  DOWNLOADED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  REVOKED: 'bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/20',
};

const EXPENSE_COLORS: Record<ExpenseStatus, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
  APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/20',
};

// ──────────────────────────────────────────
// Label formatters
// ──────────────────────────────────────────

const formatLabel = (status: string | undefined | null): string => {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

// ──────────────────────────────────────────
// Status Badge Components
// ──────────────────────────────────────────

interface StatusBadgeProps {
  className?: string;
}

export function MembershipBadge({
  status,
  className,
}: StatusBadgeProps & { status: MembershipStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', MEMBERSHIP_COLORS[status], className)}
    >
      {formatLabel(status)}
    </Badge>
  );
}

export function PaymentBadge({
  status,
  className,
}: StatusBadgeProps & { status: PaymentStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', PAYMENT_COLORS[status], className)}
    >
      {formatLabel(status)}
    </Badge>
  );
}

export function EventBadge({
  status,
  className,
}: StatusBadgeProps & { status: EventStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', EVENT_COLORS[status], className)}
    >
      {formatLabel(status)}
    </Badge>
  );
}

export function RegistrationBadge({
  status,
  className,
}: StatusBadgeProps & { status: RegistrationStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', REGISTRATION_COLORS[status], className)}
    >
      {formatLabel(status)}
    </Badge>
  );
}

export function CertificateTypeBadge({
  type,
  className,
}: { type: CertificateType } & StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', CERTIFICATE_TYPE_COLORS[type], className)}
    >
      {formatLabel(type)}
    </Badge>
  );
}

export function CertificateStatusBadge({
  status,
  className,
}: StatusBadgeProps & { status: CertificateStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', CERTIFICATE_STATUS_COLORS[status], className)}
    >
      {formatLabel(status)}
    </Badge>
  );
}

export function ExpenseBadge({
  status,
  className,
}: StatusBadgeProps & { status: ExpenseStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', EXPENSE_COLORS[status], className)}
    >
      {formatLabel(status)}
    </Badge>
  );
}

// Generic status badge for any string
export function StatusBadge({
  status,
  colorClass,
  className,
}: StatusBadgeProps & { status: string; colorClass?: string }) {
  const defaultColor = 'bg-gray-500/15 text-gray-400 border-gray-500/20 hover:bg-gray-500/20';
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', colorClass ?? defaultColor, className)}
    >
      {formatLabel(status)}
    </Badge>
  );
}
