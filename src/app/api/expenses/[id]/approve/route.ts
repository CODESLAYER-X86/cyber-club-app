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

const APPROVAL_ROLES = ["PRESIDENT", "GS", "PLATFORM_ADMIN"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: expenseId } = await params;
    const body = await request.json();
    const { approverRole, status } = body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return errorResponse("status must be APPROVED or REJECTED");
    }

    if (!approverRole || !["PRESIDENT", "GS"].includes(approverRole)) {
      return errorResponse("approverRole must be PRESIDENT or GS");
    }

    const caller = await getSupabaseUser(APPROVAL_ROLES);
    if (!caller) {
      return forbiddenResponse("Only the President, General Secretary, or Platform Admin can approve or reject expenses");
    }

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return notFoundResponse("Expense not found");
    }

    if (expense.status !== "PENDING") {
      return errorResponse(`Expense has already been resolved as ${expense.status}`);
    }

    // Verify the caller has the right role
    const isPresident = caller.role === "PRESIDENT" || caller.role === "PLATFORM_ADMIN";
    const isGs = caller.role === "GS" || caller.role === "PLATFORM_ADMIN";

    if (approverRole === "PRESIDENT" && !isPresident) {
      return forbiddenResponse("You are not authorized to act as President approver");
    }
    if (approverRole === "GS" && !isGs) {
      return forbiddenResponse("You are not authorized to act as General Secretary approver");
    }

    // Calculate next statuses
    const nextPresidentStatus = approverRole === "PRESIDENT" ? status : expense.presidentStatus;
    const nextGsStatus = approverRole === "GS" ? status : expense.gsStatus;

    // Determine overall status
    // If either rejects → REJECTED
    // If both approve → APPROVED
    // Otherwise → PENDING
    const overallStatus =
      nextPresidentStatus === "REJECTED" || nextGsStatus === "REJECTED"
        ? "REJECTED"
        : nextPresidentStatus === "APPROVED" && nextGsStatus === "APPROVED"
          ? "APPROVED"
          : "PENDING";

    const updateData: Record<string, unknown> = {
      presidentStatus: nextPresidentStatus,
      gsStatus: nextGsStatus,
      status: overallStatus,
    };

    if (approverRole === "PRESIDENT") {
      updateData.presidentApprovedBy = caller.userId;
    }
    if (approverRole === "GS") {
      updateData.gsApprovedBy = caller.userId;
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        items: true,
        presidentApprover: {
          select: { id: true, name: true },
        },
        gsApprover: {
          select: { id: true, name: true },
        },
      },
    });

    // Create notification for the submitter
    await prisma.notification.create({
      data: {
        userId: expense.createdBy,
        title: overallStatus === "APPROVED" ? "Expense Approved" : overallStatus === "REJECTED" ? "Expense Rejected" : `Expense: ${approverRole} ${status === "APPROVED" ? "Approved" : "Rejected"}`,
        message:
          overallStatus === "APPROVED"
            ? `Your expense "${expense.title}" of ৳${expense.amount} has been fully approved.`
            : overallStatus === "REJECTED"
              ? `Your expense "${expense.title}" of ৳${expense.amount} has been rejected.`
              : `Your expense "${expense.title}" has been ${status === "APPROVED" ? "approved" : "rejected"} by the ${approverRole}. Waiting for ${approverRole === "PRESIDENT" ? "General Secretary" : "President"} approval.`,
        type: overallStatus === "APPROVED" || status === "APPROVED" ? "SUCCESS" : "WARNING",
      },
    });

    // Log to audit log
    await prisma.auditLog.create({
      data: {
        userId: caller.userId,
        action: `EXPENSE_${status === "APPROVED" ? "APPROVED" : "REJECTED"}_BY_${approverRole}`,
        details: `${status === "APPROVED" ? "Approved" : "Rejected"} expense "${expense.title}" (৳${expense.amount}) as ${approverRole}. Overall status: ${overallStatus}`,
      },
    });

    return successResponse({ expense: updatedExpense });
  } catch (e) {
    console.error("[Expense Approve API] Error:", e);
    return serverErrorResponse();
  }
}
