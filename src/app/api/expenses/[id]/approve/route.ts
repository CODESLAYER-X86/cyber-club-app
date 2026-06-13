import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { getSupabaseUser } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

const APPROVE_ROLES = ["PRESIDENT", "GS", "PLATFORM_ADMIN"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get approver identity from session — not from client body
    const caller = await getSupabaseUser(APPROVE_ROLES);
    if (!caller) return forbiddenResponse("Only PRESIDENT, GS, or PLATFORM_ADMIN can approve expenses");

    const approverId = caller.userId;

    const body = await request.json();
    const { action } = body;

    const normalizedAction =
      action === "APPROVED" ? "APPROVE"
      : action === "REJECTED" ? "REJECT"
      : action;

    if (!["APPROVE", "REJECT"].includes(normalizedAction)) {
      return errorResponse("action must be APPROVE or REJECT");
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { creator: { select: { id: true, name: true } } },
    });

    if (!expense) return notFoundResponse("Expense not found");
    if (expense.status !== "PENDING") return errorResponse("Expense is not in PENDING status");

    // ANTI-FRAUD: Treasurer cannot approve their own expense submissions
    if (expense.createdBy === approverId) {
      console.warn(`[SECURITY] Self-approval attempt: userId=${approverId} expenseId=${id}`);
      return forbiddenResponse("You cannot approve your own expense submission");
    }

    const newStatus = normalizedAction === "APPROVE" ? "APPROVED" : "REJECTED";

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: { status: newStatus, approvedBy: approverId },
      include: {
        budget: { select: { id: true, title: true } },
        creator: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify the expense creator
    await prisma.notification.create({
      data: {
        userId: expense.createdBy,
        title: normalizedAction === "APPROVE" ? "Expense Approved" : "Expense Rejected",
        message:
          normalizedAction === "APPROVE"
            ? `Your expense "${expense.title}" (${expense.amount}) has been approved.`
            : `Your expense "${expense.title}" (${expense.amount}) has been rejected.`,
        type: normalizedAction === "APPROVE" ? "SUCCESS" : "WARNING",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: approverId as string,
        action: `EXPENSE_${newStatus}`,
        details: `${newStatus} expense "${expense.title}" (${expense.amount}) by ${expense.creator.name}`,
      },
    });

    return successResponse({ expense: updatedExpense });
  } catch {
    return serverErrorResponse();
  }
}
