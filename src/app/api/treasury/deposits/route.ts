import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api-utils';
import { getSupabaseUser } from '@/lib/supabase-server';

// ─── GET /api/treasury/deposits ─── List all deposits (authenticated users with finance access)
export async function GET() {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse('Authentication required');
    }

    // Only finance-related roles can view deposits
    const FINANCE_ROLES = ['TREASURER', 'PRESIDENT', 'GS', 'PLATFORM_ADMIN'];
    if (!FINANCE_ROLES.includes(caller.role)) {
      return forbiddenResponse('You do not have access to treasury data');
    }

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
    const caller = await getSupabaseUser(['TREASURER', 'PLATFORM_ADMIN']);
    if (!caller) {
      return forbiddenResponse('Only Treasurer or Platform Admin can create deposits');
    }

    const body = await request.json();
    const { date, amount, source, note, attachmentUrl } = body;

    // Validate required fields
    if (!date || !amount || !source) {
      return errorResponse('Date, amount, and source are required', 400);
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

    const deposit = await prisma.treasuryDeposit.create({
      data: {
        date: new Date(date),
        amount: parseFloat(amount),
        source,
        note: note || null,
        attachmentUrl: attachmentUrl || null,
        submittedBy: caller.userId,
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
        userId: caller.userId,
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
