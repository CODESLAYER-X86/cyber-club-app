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
    const { action, approvedBy } = body;

    if (!action || !approvedBy) {
      return errorResponse("action and approvedBy are required");
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
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

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updatedExpense = await db.expense.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy,
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
        title: action === "APPROVE" ? "Expense Approved" : "Expense Rejected",
        message:
          action === "APPROVE"
            ? `Your expense "${expense.title}" for ${expense.amount} has been approved.`
            : `Your expense "${expense.title}" for ${expense.amount} has been rejected.`,
        type: action === "APPROVE" ? "SUCCESS" : "WARNING",
      },
    });

    // Log to audit log
    await db.auditLog.create({
      data: {
        userId: approvedBy,
        action: `EXPENSE_${action === "APPROVE" ? "APPROVED" : "REJECTED"}`,
        details: `${action === "APPROVE" ? "Approved" : "Rejected"} expense "${expense.title}" (${expense.amount}) submitted by ${expense.creator.name}`,
      },
    });

    return successResponse({ expense: updatedExpense });
  } catch {
    return serverErrorResponse();
  }
}
