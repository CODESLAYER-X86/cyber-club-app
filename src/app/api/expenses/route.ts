import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse, forbiddenResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

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

    const expenses = await prisma.expense.findMany({
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
    const { title, amount, category, description, proofUrl, budgetId } = body;

    if (!title || !amount || !category || !budgetId) {
      return errorResponse("title, amount, category, and budgetId are required");
    }

    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("You must be logged in to submit expenses");
    }
    const createdBy = caller.userId;

    const expense = await prisma.expense.create({
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
