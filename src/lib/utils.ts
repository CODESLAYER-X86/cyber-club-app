import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AppView } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isViewAllowed(view: AppView, isAuthenticated: boolean, role?: string): boolean {
  // Public Views - always allowed
  const PUBLIC_VIEWS: AppView[] = [
    'landing',
    'login',
    'register',
    'about',
    'resources',
    'gallery',
    'achievements',
    'events',
    'event-detail',
    'certificate-verify',
    'certificate-public',
    'committee',
    'apply-membership',
    'announcements',
    'sponsors',
  ];
  if (PUBLIC_VIEWS.includes(view)) {
    return true;
  }

  // If not public, must be authenticated
  if (!isAuthenticated || !role) {
    return false;
  }

  // Views allowed for all authenticated users
  if ([
    'profile',
    'settings',
    'notifications',
    'dashboard',
    'announcements',
    'certificates',
    'events',
    'event-detail',
    'gallery',
    'achievements',
    'about',
    'resources',
    'committee',
    'sponsors',
  ].includes(view)) {
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
        'create-event',
        'deposits',
        'expenses',
        'analytics',
        'finance',
      ].includes(view);

    case 'VP':
      return [
        'analytics',
        'members',
        'finance',
      ].includes(view);

    case 'TREASURER':
      return [
        'deposits',
        'expenses',
        'verify-payments',
        'analytics',
        'finance',
        'members',
      ].includes(view);

    case 'MEDIA':
      return [
        'create-event',
        'analytics',
      ].includes(view);

    case 'VERIFIER':
      return [
        'verify-payments',
        'finance',
      ].includes(view);

    case 'MEMBER':
      return [
        'finance',
      ].includes(view);

    case 'GUEST':
      return [
        'apply-membership',
      ].includes(view);

    default:
      return false;
  }
}
