import prisma from "@/lib/db";
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
      prisma.user.count({
        where: { membershipStatus: { in: ["ACTIVE", "PENDING"] } },
      }),
      prisma.user.count({
        where: { membershipStatus: "ACTIVE" },
      }),
      prisma.user.count({
        where: { membershipStatus: "PENDING" },
      }),
      prisma.payment.aggregate({
        where: { status: "VERIFIED" },
        _sum: { amount: true },
      }),
      prisma.event.count({
        where: { status: { in: ["UPCOMING", "ONGOING"] } },
      }),
      prisma.payment.count({
        where: { status: "PENDING" },
      }),
      prisma.user.count({
        where: { membershipStatus: "PENDING" },
      }),
      prisma.event.count(),
      prisma.certificate.count({
        where: { status: "VALID" },
      }),
    ]);

    const totalFunds = totalFundsResult._sum.amount ?? 0;

    // Get recent activity
    const recentAuditLogs = await prisma.auditLog.findMany({
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
    const upcomingEvents = await prisma.event.findMany({
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
