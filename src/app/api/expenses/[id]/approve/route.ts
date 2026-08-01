import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api-utils';
import { getSupabaseUser } from '@/lib/supabase-server';

// ─── PATCH /api/expenses/[id]/approve ─── Dual approval (President + GS)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return errorResponse('action is required', 400);
    }

    const validActions = ['PRESIDENT_APPROVE', 'GS_APPROVE', 'PRESIDENT_REJECT', 'GS_REJECT'];
    if (!validActions.includes(action)) {
      return errorResponse('Invalid action. Use PRESIDENT_APPROVE, GS_APPROVE, PRESIDENT_REJECT, or GS_REJECT', 400);
    }

    // Authenticate and authorize based on action type
    let caller: { userId: string; email: string; role: string } | null = null;

    if (action.startsWith('PRESIDENT_')) {
      caller = await getSupabaseUser(['PRESIDENT', 'PLATFORM_ADMIN']);
      if (!caller) {
        return forbiddenResponse('Only President or Platform Admin can give president approval');
      }
    } else if (action.startsWith('GS_')) {
      caller = await getSupabaseUser(['GS', 'PLATFORM_ADMIN']);
      if (!caller) {
        return forbiddenResponse('Only GS or Platform Admin can give GS approval');
      }
    }

    if (!caller) {
      return forbiddenResponse('Unauthorized');
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!expense) {
      return errorResponse('Expense not found', 404);
    }

    if (expense.status === 'APPROVED' || expense.status === 'REJECTED') {
      return errorResponse('Expense is already finalized', 400);
    }

    let updateData: any = {};
    let auditAction = '';

    if (action === 'PRESIDENT_APPROVE') {
      updateData = {
        presidentStatus: 'APPROVED',
        presidentApprovedBy: caller.userId,
      };
      auditAction = 'EXPENSE_PRESIDENT_APPROVED';
    } else if (action === 'PRESIDENT_REJECT') {
      updateData = {
        presidentStatus: 'REJECTED',
        presidentApprovedBy: caller.userId,
        status: 'REJECTED',
      };
      auditAction = 'EXPENSE_PRESIDENT_REJECTED';
    } else if (action === 'GS_APPROVE') {
      updateData = {
        gsStatus: 'APPROVED',
        gsApprovedBy: caller.userId,
      };
      auditAction = 'EXPENSE_GS_APPROVED';
    } else if (action === 'GS_REJECT') {
      updateData = {
        gsStatus: 'REJECTED',
        gsApprovedBy: caller.userId,
        status: 'REJECTED',
      };
      auditAction = 'EXPENSE_GS_REJECTED';
    }

    // If both approved, set overall status to APPROVED
    const newPresidentStatus = updateData.presidentStatus || expense.presidentStatus;
    const newGsStatus = updateData.gsStatus || expense.gsStatus;
    if (newPresidentStatus === 'APPROVED' && newGsStatus === 'APPROVED') {
      updateData.status = 'APPROVED';
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        creator: { select: { id: true, name: true, email: true, role: true } },
        presidentApprover: { select: { id: true, name: true, email: true, role: true } },
        gsApprover: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: caller.userId,
        action: auditAction,
        details: JSON.stringify({ expenseId: id, amount: expense.amount, action }),
      },
    });

    // Create notification for the creator
    if (updateData.status === 'APPROVED') {
      await prisma.notification.create({
        data: {
          userId: expense.createdBy,
          title: 'Expense Approved',
          message: `Your expense of ৳${expense.amount.toLocaleString()} has been fully approved.`,
          type: 'SUCCESS',
        },
      });
    } else if (updateData.status === 'REJECTED') {
      await prisma.notification.create({
        data: {
          userId: expense.createdBy,
          title: 'Expense Rejected',
          message: `Your expense of ৳${expense.amount.toLocaleString()} has been rejected.`,
          type: 'ERROR',
        },
      });
    }

    return successResponse({ expense: updated });
  } catch (e) {
    console.error('[Expense Approve] Error:', e);
    return serverErrorResponse();
  }
}
