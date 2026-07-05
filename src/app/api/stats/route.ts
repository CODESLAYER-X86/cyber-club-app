import prisma from "@/lib/db";
import { successResponse, serverErrorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      creditsResult,
      activeEvents,
      pendingPayments,
      pendingApprovals,
      totalEvents,
      totalCertificates,
      recentAuditLogs,
      upcomingEvents,
      debitsResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { membershipStatus: "ACTIVE" },
      }),
      prisma.user.count({
        where: { membershipStatus: "PENDING" },
      }),
      prisma.ledgerEntry.aggregate({
        where: { type: "CREDIT" },
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
      prisma.auditLog.findMany({
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
      }),
      prisma.event.findMany({
        where: { status: "UPCOMING" },
        take: 5,
        orderBy: { startDate: "asc" },
        include: {
          _count: {
            select: { registrations: true },
          },
        },
      }),
      prisma.ledgerEntry.aggregate({
        where: { type: "DEBIT" },
        _sum: { amount: true },
      }),
    ]);

    const totalFunds = (creditsResult._sum.amount ?? 0) - (debitsResult._sum.amount ?? 0);

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
  } catch (e) {
    console.error("[Stats API] Error:", e);
    return serverErrorResponse();
  }
}
