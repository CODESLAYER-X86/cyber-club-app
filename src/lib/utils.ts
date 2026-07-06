import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AppView } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isViewAllowed(view: AppView, isAuthenticated: boolean, role?: string): boolean {
  // Public Views - always allowed
  const PUBLIC_VIEWS = [
    'landing',
    'login',
    'register',
    'about',
    'gallery',
    'achievements',
    'events',
    'event-detail',
    'certificate-verify',
    'certificate-public',
    'committee',
  ];
  if (PUBLIC_VIEWS.includes(view)) {
    return true;
  }

  // If not public, must be authenticated
  if (!isAuthenticated || !role) {
    return false;
  }

  // Views allowed for all authenticated users
  if (['profile', 'settings', 'notifications', 'dashboard'].includes(view)) {
    return true;
  }

  // Role-based authorization
  switch (role) {
    case 'PLATFORM_ADMIN':
      return true;

    case 'PRESIDENT':
      return true;

    case 'GS':
      return [
        'member-approval',
        'certificate-authority',
        'certificate-designer',
        'members',
        'events',
        'event-detail',
        'create-event',
        'gallery',
        'achievements',
        'committee',
        'expenses',
        'analytics',
        'finance',
        'announcements',
      ].includes(view);

    case 'VP':
      return [
        'dashboard',
        'analytics',
        'events',
        'event-detail',
        'gallery',
        'achievements',
        'members',
        'finance',
      ].includes(view);

    case 'TREASURER':
      return [
        'dashboard',
        'budgets',
        'expenses',
        'verify-payments',
        'analytics',
        'finance',
        'gallery',
        'achievements',
      ].includes(view);

    case 'MEDIA':
      return [
        'dashboard',
        'events',
        'event-detail',
        'create-event',
        'gallery',
        'achievements',
        'announcements',
        'committee',
        'analytics',
      ].includes(view);

    case 'VERIFIER':
      return [
        'dashboard',
        'verify-payments',
        'events',
        'event-detail',
        'gallery',
        'achievements',
        'certificates',
        'finance',
      ].includes(view);

    case 'MEMBER':
      return [
        'dashboard',
        'events',
        'event-detail',
        'gallery',
        'achievements',
        'certificates',
        'finance',
        'committee',
      ].includes(view);

    case 'GUEST':
      return ['dashboard', 'apply-membership'].includes(view);

    default:
      return false;
  }
}
