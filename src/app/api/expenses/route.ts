import { db } from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const budgetId = searchParams.get("budgetId");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (budgetId) {
      where.budgetId = budgetId;
    }

    const expenses = await db.expense.findMany({
      where,
      include: {
        budget: {
          select: {
            id: true,
            title: true,
            category: true,
            period: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ expenses });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, amount, category, description, proofUrl, budgetId, createdBy } = body;

    if (!title || !amount || !category || !budgetId || !createdBy) {
      return errorResponse("title, amount, category, budgetId, and createdBy are required");
    }

    const expense = await db.expense.create({
      data: {
        title,
        amount,
        category,
        description,
        proofUrl,
        budgetId,
        createdBy,
        status: "PENDING",
      },
      include: {
        budget: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return successResponse({ expense }, 201);
  } catch {
    return serverErrorResponse();
  }
}
