import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AppView } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes URLs to prevent link-based DOM XSS (e.g. javascript: / vbscript: pseudo-protocols).
 * Allows: http:, https:, mailto:, tel:, relative paths (/...), in-page anchors (#...), or data:image/.
 * Prepend https:// for domain-like inputs without protocol (e.g. linkedin.com/in/...).
 */
export function sanitizeUrl(url?: string | null, fallback = '#'): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Strip control characters and whitespace used in obfuscation bypasses
  const normalized = trimmed.replace(/[\u0000-\u001F\u007F-\u009F\s]/g, '').toLowerCase();
  if (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('vbscript:') ||
    (normalized.startsWith('data:') && !normalized.startsWith('data:image/'))
  ) {
    return fallback;
  }

  // Allow safe relative paths, anchors, or phone/mail
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }

  if (/^(https?|mailto|tel):/i.test(trimmed)) {
    return trimmed;
  }

  // Allow data:image/ for base64 images and logos
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Auto-prefix domains without protocol like "facebook.com/club" or "www.github.com"
  if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return fallback;
}

export function isSafeUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const sanitized = sanitizeUrl(url, '');
  return sanitized !== '' && sanitized !== '#';
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
    'finance',
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
        'roles',
      ].includes(view);

    case 'VP':
      return [
        'member-approval',
        'roles',
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
