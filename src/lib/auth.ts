/**
 * Auth utilities — Google OAuth only (via Supabase).
 *
 * NextAuth / email-password credentials have been removed.
 * This module only exports the platform-admin email check used by
 * API routes and the OAuth callback.
 */

/**
 * Check if an email is a Platform Admin (env-controlled — never from DB alone).
 * Supports comma-separated emails in the PLATFORM_ADMIN_EMAIL env var.
 */
export function isPlatformAdminEmail(email: string): boolean {
  const envVal = process.env.PLATFORM_ADMIN_EMAIL;
  if (!envVal) return false;
  return envVal
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase().trim());
}
