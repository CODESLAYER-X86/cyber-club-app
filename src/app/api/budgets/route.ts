import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse, forbiddenResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET() {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("You must be logged in to view budgets");
    }

    const budgets = await prisma.budget.findMany({
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
    const { title, amount, category, period } = body;

    if (!title || !amount || !category || !period) {
      return errorResponse("title, amount, category, and period are required");
    }

    const caller = await getSupabaseUser(["TREASURER", "PRESIDENT", "PLATFORM_ADMIN"]);
    if (!caller) {
      return forbiddenResponse("Only TREASURER, PRESIDENT, or PLATFORM_ADMIN can create budgets");
    }
    const createdBy = caller.userId;

    const budget = await prisma.budget.create({
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
