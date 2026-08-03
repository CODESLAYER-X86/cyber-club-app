import prisma from '@/lib/db';
import { successResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api-utils';
import { getSupabaseUser } from '@/lib/supabase-server';

// ─── GET /api/stats ─── Dashboard stats with treasury data (authenticated users only)
export async function GET() {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse('Authentication required');
    }

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
      // Real data for charts
      eventDistribution,
      totalCertificates,
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
      // Event distribution by category for pie chart
      prisma.event.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      // Total certificates for VP card
      prisma.certificate.count({ where: { status: 'GENERATED' } }),
    ]);

    const totalDeposits = approvedDepositsResult._sum.amount ?? 0;
    const totalExpenses = approvedExpensesResult._sum.amount ?? 0;
    const currentBalance = totalDeposits - totalExpenses;

    // Build member growth data (last 6 months) — parallelized
    const now = new Date();
    const memberGrowth = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const idx = 5 - i;
        const monthDate = new Date(now.getFullYear(), now.getMonth() - idx, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - idx + 1, 1);
        return prisma.user.count({
          where: {
            createdAt: { lt: nextMonth },
            membershipStatus: { in: ['ACTIVE', 'PENDING'] },
          },
        }).then(count => ({
          month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          members: count,
        }));
      })
    );

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
        totalCertificates,
      },
      recentActivity: recentAuditLogs,
      upcomingEvents,
      memberGrowth,
      eventDistribution: eventDistribution.map(e => ({
        category: e.category,
        count: e._count.category,
      })),
    });
  } catch (e) {
    console.error('[Stats API] Error:', e);
    return serverErrorResponse();
  }
}
