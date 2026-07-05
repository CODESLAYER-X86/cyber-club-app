import prisma from "@/lib/db";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

const APPROVE_ROLES = ["PRESIDENT", "PLATFORM_ADMIN"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: budgetId } = await params;
    const body = await request.json();
    const { status = "APPROVED" } = body;

    // Enforce President or Admin authorization
    const caller = await getSupabaseUser(APPROVE_ROLES);
    if (!caller) {
      return forbiddenResponse("Only the President or Platform Admin can approve or reject budgets");
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return errorResponse("Invalid status value. Must be 'APPROVED' or 'REJECTED'");
    }

    // Verify budget exists
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      return notFoundResponse("Budget not found");
    }

    if (budget.status !== "PENDING") {
      return errorResponse(`Budget has already been resolved as ${budget.status}`);
    }

    // Update status
    const updatedBudget = await prisma.budget.update({
      where: { id: budgetId },
      data: {
        status,
        approvedBy: status === "APPROVED" ? caller.userId : null,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        approver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return successResponse({ budget: updatedBudget });
  } catch (e) {
    console.error("[Budget Approve API] Error:", e);
    return serverErrorResponse();
  }
}
