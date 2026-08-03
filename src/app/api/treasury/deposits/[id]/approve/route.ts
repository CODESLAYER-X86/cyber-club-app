import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-utils';

// ─── PATCH /api/treasury/deposits/[id]/approve ─── Dual approval (President + GS)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, approvedBy, role } = body;

    // action: "PRESIDENT_APPROVE" | "GS_APPROVE" | "PRESIDENT_REJECT" | "GS_REJECT"
    if (!action || !approvedBy || !role) {
      return errorResponse('action, approvedBy, and role are required', 400);
    }

    const validRoles = ['PRESIDENT', 'GS', 'PLATFORM_ADMIN'];
    if (!validRoles.includes(role)) {
      return errorResponse('Only President, GS, or Platform Admin can approve/reject', 403);
    }

    const deposit = await prisma.treasuryDeposit.findUnique({ where: { id } });
    if (!deposit) {
      return errorResponse('Deposit not found', 404);
    }

    if (deposit.status === 'APPROVED' || deposit.status === 'REJECTED') {
      return errorResponse('Deposit is already finalized', 400);
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
      auditAction = 'DEPOSIT_PRESIDENT_APPROVED';
    } else if (action === 'PRESIDENT_REJECT') {
      if (!['PRESIDENT', 'PLATFORM_ADMIN'].includes(role)) {
        return errorResponse('Only President can reject', 403);
      }
      updateData = {
        presidentStatus: 'REJECTED',
        presidentApprovedBy: approvedBy,
        status: 'REJECTED',
      };
      auditAction = 'DEPOSIT_PRESIDENT_REJECTED';
    } else if (action === 'GS_APPROVE') {
      if (!['GS', 'PLATFORM_ADMIN'].includes(role)) {
        return errorResponse('Only GS can give GS approval', 403);
      }
      updateData = {
        gsStatus: 'APPROVED',
        gsApprovedBy: approvedBy,
      };
      auditAction = 'DEPOSIT_GS_APPROVED';
    } else if (action === 'GS_REJECT') {
      if (!['GS', 'PLATFORM_ADMIN'].includes(role)) {
        return errorResponse('Only GS can reject', 403);
      }
      updateData = {
        gsStatus: 'REJECTED',
        gsApprovedBy: approvedBy,
        status: 'REJECTED',
      };
      auditAction = 'DEPOSIT_GS_REJECTED';
    } else {
      return errorResponse('Invalid action. Use PRESIDENT_APPROVE, GS_APPROVE, PRESIDENT_REJECT, or GS_REJECT', 400);
    }

    // If both approved, set overall status to APPROVED
    const newPresidentStatus = updateData.presidentStatus || deposit.presidentStatus;
    const newGsStatus = updateData.gsStatus || deposit.gsStatus;
    if (newPresidentStatus === 'APPROVED' && newGsStatus === 'APPROVED') {
      updateData.status = 'APPROVED';
    }

    const updated = await prisma.treasuryDeposit.update({
      where: { id },
      data: updateData,
      include: {
        submitter: { select: { id: true, name: true, email: true, role: true } },
        presidentApprover: { select: { id: true, name: true, email: true, role: true } },
        gsApprover: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: approvedBy,
        action: auditAction,
        details: JSON.stringify({ depositId: id, amount: deposit.amount, action }),
      },
    });

    // Create notification for the submitter when deposit is fully approved
    if (updateData.status === 'APPROVED') {
      await prisma.notification.create({
        data: {
          userId: deposit.submittedBy,
          title: 'Deposit Approved',
          message: `Your deposit of ৳${deposit.amount.toLocaleString()} from ${deposit.source} has been fully approved.`,
          type: 'SUCCESS',
        },
      });
    } else if (updateData.status === 'REJECTED') {
      await prisma.notification.create({
        data: {
          userId: deposit.submittedBy,
          title: 'Deposit Rejected',
          message: `Your deposit of ৳${deposit.amount.toLocaleString()} from ${deposit.source} has been rejected.`,
          type: 'ERROR',
        },
      });
    }

    return successResponse({ deposit: updated });
  } catch (e) {
    console.error('[Deposit Approve] Error:', e);
    return serverErrorResponse();
  }
}
