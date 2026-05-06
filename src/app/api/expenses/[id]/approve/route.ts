import { db } from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, approvedBy, status, approverId } = body;

    // Accept both field name formats: action/approvedBy (API format) or status/approverId (legacy)
    const effectiveAction = action || (status === 'APPROVED' ? 'APPROVE' : status === 'REJECTED' ? 'REJECT' : status);
    const effectiveApprover = approvedBy || approverId;

    if (!effectiveAction || !effectiveApprover) {
      return errorResponse("action and approvedBy are required");
    }

    // Accept both APPROVE/APPROVED and REJECT/REJECTED formats
    const normalizedAction = effectiveAction === "APPROVED" ? "APPROVE" : effectiveAction === "REJECTED" ? "REJECT" : effectiveAction;
    if (!["APPROVE", "REJECT"].includes(normalizedAction)) {
      return errorResponse("Action must be APPROVE or REJECT");
    }

    const expense = await db.expense.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!expense) {
      return notFoundResponse("Expense not found");
    }

    if (expense.status !== "PENDING") {
      return errorResponse("Expense is not in PENDING status");
    }

    const newStatus = normalizedAction === "APPROVE" ? "APPROVED" : "REJECTED";

    const updatedExpense = await db.expense.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: effectiveApprover,
      },
      include: {
        budget: {
          select: {
            id: true,
            title: true,
          },
        },
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
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: expense.createdBy,
        title: normalizedAction === "APPROVE" ? "Expense Approved" : "Expense Rejected",
        message:
          normalizedAction === "APPROVE"
            ? `Your expense "${expense.title}" for ${expense.amount} has been approved.`
            : `Your expense "${expense.title}" for ${expense.amount} has been rejected.`,
        type: normalizedAction === "APPROVE" ? "SUCCESS" : "WARNING",
      },
    });

    // Log to audit log
    await db.auditLog.create({
      data: {
        userId: effectiveApprover,
        action: `EXPENSE_${normalizedAction === "APPROVE" ? "APPROVED" : "REJECTED"}`,
        details: `${normalizedAction === "APPROVE" ? "Approved" : "Rejected"} expense "${expense.title}" (${expense.amount}) submitted by ${expense.creator.name}`,
      },
    });

    return successResponse({ expense: updatedExpense });
  } catch {
    return serverErrorResponse();
  }
}
