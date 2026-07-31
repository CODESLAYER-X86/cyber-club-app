import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-utils';

// ─── GET /api/treasury/deposits ─── List all deposits (with submitter & approver info)
export async function GET() {
  try {
    const deposits = await prisma.treasuryDeposit.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        submitter: { select: { id: true, name: true, email: true, role: true } },
        presidentApprover: { select: { id: true, name: true, email: true, role: true } },
        gsApprover: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return successResponse({ deposits });
  } catch (e) {
    console.error('[Deposits GET] Error:', e);
    return serverErrorResponse();
  }
}

// ─── POST /api/treasury/deposits ─── Create a new deposit (Treasurer/Platform Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, amount, source, note, attachmentUrl, submittedBy } = body;

    // Validate required fields
    if (!date || !amount || !source || !submittedBy) {
      return errorResponse('Date, amount, source, and submittedBy are required', 400);
    }

    if (amount <= 0) {
      return errorResponse('Amount must be greater than 0', 400);
    }

    const validSources = [
      'UNIVERSITY_FUND', 'SPONSOR', 'EVENT_REGISTRATION',
      'MEMBERSHIP_REGISTRATION', 'DONATION', 'OTHER',
    ];
    if (!validSources.includes(source)) {
      return errorResponse('Invalid source type', 400);
    }

    // Verify the submitter is a TREASURER or PLATFORM_ADMIN
    const user = await prisma.user.findUnique({ where: { id: submittedBy } });
    if (!user || !['TREASURER', 'PLATFORM_ADMIN'].includes(user.role)) {
      return errorResponse('Only Treasurer or Platform Admin can create deposits', 403);
    }

    const deposit = await prisma.treasuryDeposit.create({
      data: {
        date: new Date(date),
        amount: parseFloat(amount),
        source,
        note: note || null,
        attachmentUrl: attachmentUrl || null,
        submittedBy,
        status: 'PENDING',
        presidentStatus: 'PENDING',
        gsStatus: 'PENDING',
      },
      include: {
        submitter: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: submittedBy,
        action: 'DEPOSIT_CREATED',
        details: JSON.stringify({ depositId: deposit.id, amount: deposit.amount, source: deposit.source }),
      },
    });

    return successResponse({ deposit }, 201);
  } catch (e) {
    console.error('[Deposits POST] Error:', e);
    return serverErrorResponse();
  }
}
