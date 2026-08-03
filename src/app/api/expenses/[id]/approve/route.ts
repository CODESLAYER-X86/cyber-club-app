import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-utils';

// ─── PATCH /api/expenses/[id]/approve ─── Dual approval (President + GS)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, approvedBy, role } = body;

    if (!action || !approvedBy || !role) {
      return errorResponse('action, approvedBy, and role are required', 400);
    }

    const validRoles = ['PRESIDENT', 'GS', 'PLATFORM_ADMIN'];
    if (!validRoles.includes(role)) {
      return errorResponse('Only President, GS, or Platform Admin can approve/reject', 403);
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
      if (!['PRESIDENT', 'PLATFORM_ADMIN'].includes(role)) {
        return errorResponse('Only President can give president approval', 403);
      }
      updateData = {
        presidentStatus: 'APPROVED',
        presidentApprovedBy: approvedBy,
      };
      auditAction = 'EXPENSE_PRESIDENT_APPROVED';
    } else if (action === 'PRESIDENT_REJECT') {
      if (!['PRESIDENT', 'PLATFORM_ADMIN'].includes(role)) {
        return errorResponse('Only President can reject', 403);
      }
      updateData = {
        presidentStatus: 'REJECTED',
        presidentApprovedBy: approvedBy,
        status: 'REJECTED',
      };
      auditAction = 'EXPENSE_PRESIDENT_REJECTED';
    } else if (action === 'GS_APPROVE') {
      if (!['GS', 'PLATFORM_ADMIN'].includes(role)) {
        return errorResponse('Only GS can give GS approval', 403);
      }
      updateData = {
        gsStatus: 'APPROVED',
        gsApprovedBy: approvedBy,
      };
      auditAction = 'EXPENSE_GS_APPROVED';
    } else if (action === 'GS_REJECT') {
      if (!['GS', 'PLATFORM_ADMIN'].includes(role)) {
        return errorResponse('Only GS can reject', 403);
      }
      updateData = {
        gsStatus: 'REJECTED',
        gsApprovedBy: approvedBy,
        status: 'REJECTED',
      };
      auditAction = 'EXPENSE_GS_REJECTED';
    } else {
      return errorResponse('Invalid action. Use PRESIDENT_APPROVE, GS_APPROVE, PRESIDENT_REJECT, or GS_REJECT', 400);
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
        userId: approvedBy,
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
