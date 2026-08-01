import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api-utils';
import { getSupabaseUser } from '@/lib/supabase-server';

// ─── GET /api/expenses ─── List all expenses (authenticated users with finance access)
export async function GET(request: NextRequest) {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse('Authentication required');
    }

    // Only finance-related roles can view expenses
    const FINANCE_ROLES = ['TREASURER', 'PRESIDENT', 'GS', 'PLATFORM_ADMIN'];
    if (!FINANCE_ROLES.includes(caller.role)) {
      return forbiddenResponse('You do not have access to expense data');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { orderBy: { id: 'asc' } },
        creator: { select: { id: true, name: true, email: true, role: true } },
        presidentApprover: { select: { id: true, name: true, email: true, role: true } },
        gsApprover: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return successResponse({ expenses });
  } catch (e) {
    console.error('[Expenses GET] Error:', e);
    return serverErrorResponse();
  }
}

// ─── POST /api/expenses ─── Create expense with items (Treasurer/Platform Admin only)
export async function POST(request: NextRequest) {
  try {
    const caller = await getSupabaseUser(['TREASURER', 'PLATFORM_ADMIN']);
    if (!caller) {
      return forbiddenResponse('Only Treasurer or Platform Admin can create expenses');
    }

    const body = await request.json();
    const { date, note, purchasedBy, attachmentUrl, items } = body;

    // Validate required fields
    if (!date || !items || !items.length) {
      return errorResponse('Date and items are required', 400);
    }

    // Validate items and calculate total
    let totalAmount = 0;
    for (const item of items) {
      if (!item.itemName || item.quantity <= 0 || item.price < 0) {
        return errorResponse('Each item must have a name, positive quantity, and valid price', 400);
      }
      totalAmount += item.quantity * item.price;
    }

    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        note: note || '',
        amount: totalAmount,
        purchasedBy: purchasedBy || null,
        attachmentUrl: attachmentUrl || null,
        status: 'PENDING',
        presidentStatus: 'PENDING',
        gsStatus: 'PENDING',
        createdBy: caller.userId,
        items: {
          create: items.map((item: any) => ({
            itemName: item.itemName,
            quantity: parseInt(item.quantity) || 1,
            unit: item.unit || 'pcs',
            price: parseFloat(item.price) || 0,
          })),
        },
      },
      include: {
        items: true,
        creator: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: caller.userId,
        action: 'EXPENSE_CREATED',
        details: JSON.stringify({ expenseId: expense.id, amount: expense.amount, itemCount: items.length }),
      },
    });

    return successResponse({ expense }, 201);
  } catch (e) {
    console.error('[Expenses POST] Error:', e);
    return serverErrorResponse();
  }
}
