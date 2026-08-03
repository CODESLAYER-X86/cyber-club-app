import prisma from '@/lib/db';
import { successResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api-utils';
import { getSupabaseUser } from '@/lib/supabase-server';

// ─── GET /api/activity ─── Personal activity feed for any authenticated user
// Returns activity entries relevant to the current user (registrations, certificates, payments, etc.)
// This is the member-accessible alternative to /api/audit-logs (which is admin-only)
export async function GET() {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse('Authentication required');
    }

    const userId = caller.userId;
    const isAdmin = ['PRESIDENT', 'GS', 'PLATFORM_ADMIN', 'VP'].includes(caller.role);

    // For admin users, return recent global audit logs (same as audit-logs but read-only)
    // For regular members, build a personal activity feed from their own data
    if (isAdmin) {
      const auditLogs = await prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        },
      });

      return successResponse({
        activities: auditLogs.map(log => ({
          id: log.id,
          type: 'AUDIT',
          action: log.action,
          description: log.details,
          createdAt: log.createdAt,
          user: log.user ? { name: log.user.name, email: log.user.email } : null,
        })),
      });
    }

    // For regular members (MEMBER, VERIFIER, TREASURER, MEDIA, etc.):
    // Build a personal activity feed from multiple sources
    const [registrations, certificates, payments, attendance] = await Promise.all([
      // Event registrations
      prisma.eventRegistration.findMany({
        where: { userId },
        take: 5,
        orderBy: { id: 'desc' },
        include: { event: { select: { id: true, title: true, category: true, startDate: true } } },
      }),
      // Certificates received
      prisma.certificate.findMany({
        where: { userId },
        take: 5,
        orderBy: { issuedAt: 'desc' },
        include: { event: { select: { id: true, title: true } } },
      }),
      // Payments made
      prisma.payment.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { event: { select: { id: true, title: true } } },
      }),
      // Attendance records
      prisma.attendance.findMany({
        where: { userId },
        take: 5,
        orderBy: { id: 'desc' },
        include: { event: { select: { id: true, title: true } } },
      }),
    ]);

    // Build unified activity list
    const activities: {
      id: string;
      type: string;
      action: string;
      description: string;
      createdAt: Date;
      user: null;
    }[] = [];

    for (const reg of registrations) {
      activities.push({
        id: `reg-${reg.id}`,
        type: 'REGISTRATION',
        action: 'EVENT_REGISTERED',
        description: `Registered for "${reg.event.title}"`,
        createdAt: reg.id ? new Date() : new Date(), // EventRegistration doesn't have createdAt, use current
        user: null,
      });
    }

    for (const cert of certificates) {
      activities.push({
        id: `cert-${cert.id}`,
        type: 'CERTIFICATE',
        action: cert.status === 'REVOKED' ? 'CERTIFICATE_REVOKED' : 'CERTIFICATE_ISSUED',
        description: cert.status === 'REVOKED'
          ? `Certificate for "${cert.event?.title || 'Unknown'}" was revoked`
          : `Received certificate for "${cert.event?.title || 'Unknown'}"`,
        createdAt: cert.issuedAt || new Date(),
        user: null,
      });
    }

    for (const pay of payments) {
      activities.push({
        id: `pay-${pay.id}`,
        type: 'PAYMENT',
        action: pay.status === 'VERIFIED' ? 'PAYMENT_VERIFIED' : pay.status === 'REJECTED' ? 'PAYMENT_REJECTED' : 'PAYMENT_SUBMITTED',
        description: pay.status === 'VERIFIED'
          ? `Payment of ৳${pay.amount} verified for "${pay.event?.title || 'Unknown'}"`
          : pay.status === 'REJECTED'
          ? `Payment of ৳${pay.amount} rejected for "${pay.event?.title || 'Unknown'}"`
          : `Payment of ৳${pay.amount} submitted for "${pay.event?.title || 'Unknown'}"`,
        createdAt: pay.createdAt,
        user: null,
      });
    }

    for (const att of attendance) {
      activities.push({
        id: `att-${att.id}`,
        type: 'ATTENDANCE',
        action: 'ATTENDANCE_MARKED',
        description: `Attendance marked for "${att.event.title}"`,
        createdAt: new Date(), // Attendance doesn't have createdAt
        user: null,
      });
    }

    // Sort by createdAt descending and take top 10
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const topActivities = activities.slice(0, 10);

    return successResponse({ activities: topActivities });
  } catch (e) {
    console.error('[Activity API] Error:', e);
    return serverErrorResponse();
  }
}
