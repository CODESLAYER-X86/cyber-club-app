import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api-utils';
import { getSupabaseUser } from '@/lib/supabase-server';

// ─── PATCH /api/treasury/deposits/[id]/approve ─── Dual approval (President + GS)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // action: "PRESIDENT_APPROVE" | "GS_APPROVE" | "PRESIDENT_REJECT" | "GS_REJECT"
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
      updateData = {
        presidentStatus: 'APPROVED',
        presidentApprovedBy: caller.userId,
      };
      auditAction = 'DEPOSIT_PRESIDENT_APPROVED';
    } else if (action === 'PRESIDENT_REJECT') {
      updateData = {
        presidentStatus: 'REJECTED',
        presidentApprovedBy: caller.userId,
        status: 'REJECTED',
      };
      auditAction = 'DEPOSIT_PRESIDENT_REJECTED';
    } else if (action === 'GS_APPROVE') {
      updateData = {
        gsStatus: 'APPROVED',
        gsApprovedBy: caller.userId,
      };
      auditAction = 'DEPOSIT_GS_APPROVED';
    } else if (action === 'GS_REJECT') {
      updateData = {
        gsStatus: 'REJECTED',
        gsApprovedBy: caller.userId,
        status: 'REJECTED',
      };
      auditAction = 'DEPOSIT_GS_REJECTED';
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
        userId: caller.userId,
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
