import { db } from "@/lib/db";
import { successResponse, serverErrorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      totalFundsResult,
      activeEvents,
      pendingPayments,
      pendingApprovals,
      totalEvents,
      totalCertificates,
    ] = await Promise.all([
      db.user.count({
        where: { membershipStatus: { in: ["ACTIVE", "PENDING"] } },
      }),
      db.user.count({
        where: { membershipStatus: "ACTIVE" },
      }),
      db.user.count({
        where: { membershipStatus: "PENDING" },
      }),
      db.payment.aggregate({
        where: { status: "VERIFIED" },
        _sum: { amount: true },
      }),
      db.event.count({
        where: { status: { in: ["UPCOMING", "ONGOING"] } },
      }),
      db.payment.count({
        where: { status: "PENDING" },
      }),
      db.user.count({
        where: { membershipStatus: "PENDING" },
      }),
      db.event.count(),
      db.certificate.count({
        where: { status: "VALID" },
      }),
    ]);

    const totalFunds = totalFundsResult._sum.amount ?? 0;

    // Get recent activity
    const recentAuditLogs = await db.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Get upcoming events
    const upcomingEvents = await db.event.findMany({
      where: { status: "UPCOMING" },
      take: 5,
      orderBy: { startDate: "asc" },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    return successResponse({
      stats: {
        totalMembers,
        activeMembers,
        pendingMembers,
        totalFunds,
        activeEvents,
        pendingPayments,
        pendingApprovals,
        totalEvents,
        totalCertificates,
      },
      recentActivity: recentAuditLogs,
      upcomingEvents,
    });
  } catch {
    return serverErrorResponse();
  }
}
