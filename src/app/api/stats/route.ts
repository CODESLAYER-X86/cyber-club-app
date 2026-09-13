import prisma from '@/lib/db';
import { successResponse, serverErrorResponse } from '@/lib/api-utils';
import { getSupabaseUser } from '@/lib/supabase-server';

// ─── GET /api/stats ─── Dashboard stats with treasury data
export async function GET() {
  try {
    const caller = await getSupabaseUser();
    const isGuest = !caller || caller.role === 'GUEST';
    const canViewTreasury = !isGuest; // All authenticated members/executives can view; GUEST and unauthenticated cannot
    const canViewAuditLogs = !!(caller && ['PRESIDENT', 'PLATFORM_ADMIN', 'GS'].includes(caller.role));

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
      canViewTreasury
        ? prisma.payment.count({ where: { status: 'PENDING' } })
        : Promise.resolve(0),
      prisma.event.count(),
      canViewAuditLogs
        ? prisma.auditLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
            },
          })
        : Promise.resolve([]),
      prisma.event.findMany({
        where: { status: 'UPCOMING' },
        take: 5,
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          category: true,
          startDate: true,
          endDate: true,
          venue: true,
          fee: true,
          maxSeats: true,
          currentSeats: true,
          poster: true,
          status: true,
          _count: { select: { registrations: true } },
        },
      }),
      // Treasury: only query when caller is authorized executive
      canViewTreasury
        ? prisma.treasuryDeposit.aggregate({
            where: { status: 'APPROVED' },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: 0 } }),
      canViewTreasury
        ? prisma.expense.aggregate({
            where: { status: 'APPROVED' },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: 0 } }),
      canViewTreasury
        ? prisma.treasuryDeposit.count({ where: { status: 'PENDING' } })
        : Promise.resolve(0),
      canViewTreasury
        ? prisma.expense.count({ where: { status: 'PENDING' } })
        : Promise.resolve(0),
    ]);

    const totalDeposits = canViewTreasury ? (approvedDepositsResult._sum.amount ?? 0) : 0;
    const totalExpenses = canViewTreasury ? (approvedExpensesResult._sum.amount ?? 0) : 0;
    const currentBalance = canViewTreasury ? totalDeposits - totalExpenses : 0;

    const statsPayload: Record<string, unknown> = {
      totalMembers,
      activeMembers,
      activeEvents,
      totalEvents,
    };

    if (canViewTreasury) {
      statsPayload.totalFunds = currentBalance;
      statsPayload.totalDeposits = totalDeposits;
      statsPayload.totalExpenses = totalExpenses;
      statsPayload.currentBalance = currentBalance;
      statsPayload.pendingMembers = pendingMembers;
      statsPayload.pendingPayments = pendingPayments;
      statsPayload.pendingApprovals = pendingMembers;
      statsPayload.pendingDepositsCount = pendingDepositsCount;
      statsPayload.pendingExpensesCount = pendingExpensesCount;
    }

    return successResponse({
      stats: statsPayload,
      recentActivity: recentAuditLogs,
      upcomingEvents,
    });
  } catch (e) {
    console.error('[Stats API] Error:', e);
    return serverErrorResponse();
  }
}
