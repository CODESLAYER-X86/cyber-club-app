import { db } from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const budgets = await db.budget.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        expenses: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
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
        },
        _count: {
          select: { expenses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ budgets });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, amount, category, period, createdBy } = body;

    if (!title || !amount || !category || !period || !createdBy) {
      return errorResponse("title, amount, category, period, and createdBy are required");
    }

    const budget = await db.budget.create({
      data: {
        title,
        amount,
        category,
        period,
        createdBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return successResponse({ budget }, 201);
  } catch {
    return serverErrorResponse();
  }
}
