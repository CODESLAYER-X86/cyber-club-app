import prisma from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api-utils';

// ─── GET /api/stats ─── Dashboard stats with treasury data
export async function GET() {
  try {
    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      activeEvents,
      pendingPayments,
      totalEvents,
      recentAuditLogs,
      upcomingEvents,
      approvedDepositsResult,
      approvedExpensesResult,
      pendingDepositsCount,
      pendingExpensesCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { membershipStatus: 'ACTIVE' } }),
      prisma.user.count({ where: { membershipStatus: 'PENDING' } }),
      prisma.event.count({ where: { status: { in: ['UPCOMING', 'ONGOING'] } } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.event.count(),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        },
      }),
      prisma.event.findMany({
        where: { status: 'UPCOMING' },
        take: 5,
        orderBy: { startDate: 'asc' },
        include: { _count: { select: { registrations: true } } },
      }),
      // Treasury: sum of approved deposits
      prisma.treasuryDeposit.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),
      // Treasury: sum of approved expenses
      prisma.expense.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),
      // Pending deposits count
      prisma.treasuryDeposit.count({ where: { status: 'PENDING' } }),
      // Pending expenses count
      prisma.expense.count({ where: { status: 'PENDING' } }),
    ]);

    const totalDeposits = approvedDepositsResult._sum.amount ?? 0;
    const totalExpenses = approvedExpensesResult._sum.amount ?? 0;
    const currentBalance = totalDeposits - totalExpenses;

    return successResponse({
      stats: {
        totalMembers,
        activeMembers,
        pendingMembers,
        totalFunds: currentBalance,
        totalDeposits,
        totalExpenses,
        currentBalance,
        activeEvents,
        pendingPayments,
        pendingApprovals: pendingMembers,
        totalEvents,
        pendingDepositsCount,
        pendingExpensesCount,
      },
      recentActivity: recentAuditLogs,
      upcomingEvents,
    });
  } catch (e) {
    console.error('[Stats API] Error:', e);
    return serverErrorResponse();
  }
}
