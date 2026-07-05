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

const APPROVE_ROLES = ["PRESIDENT", "TREASURER", "PLATFORM_ADMIN"];
const VALID_WALLETS = ["BKASH_PERSONAL", "NAGAD_PERSONAL", "CLUB_BANK_ACCOUNT", "CASH_IN_HAND"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: expenseId } = await params;
    const body = await request.json();
    const { status = "APPROVED", wallet } = body;

    // Enforce authorization
    const caller = await getSupabaseUser(APPROVE_ROLES);
    if (!caller) {
      return forbiddenResponse("Only the President, Treasurer, or Platform Admin can approve or reject expenses");
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return errorResponse("Invalid status value. Must be 'APPROVED' or 'REJECTED'");
    }

    // Verify expense exists
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return notFoundResponse("Expense not found");
    }

    if (expense.status !== "PENDING") {
      return errorResponse(`Expense has already been resolved as ${expense.status}`);
    }

    // If approving a CLUB_FUND expense, a wallet must be specified to debit from
    if (status === "APPROVED" && expense.fundingSource === "CLUB_FUND") {
      if (!wallet || !VALID_WALLETS.includes(wallet)) {
        return errorResponse(`A valid wallet is required to debit this CLUB_FUND expense. Must be one of: ${VALID_WALLETS.join(", ")}`);
      }
    }

    const updatedExpense = await prisma.$transaction(async (tx) => {
      // 1. Update expense status
      const updated = await tx.expense.update({
        where: { id: expenseId },
        data: {
          status,
          approvedBy: caller.userId,
        },
        include: {
          budget: {
            select: { id: true, title: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
          approver: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // 2. If approved and funded from club fund, post debit entry to ledger
      if (status === "APPROVED" && expense.fundingSource === "CLUB_FUND") {
        await tx.ledgerEntry.create({
          data: {
            type: "DEBIT",
            amount: expense.amount,
            wallet: wallet!,
            description: `Expense payout: ${expense.title}`,
            referenceId: expenseId,
            performedBy: caller.userId,
          },
        });
      }

      return updated;
    });

    return successResponse({ expense: updatedExpense });
  } catch (e) {
    console.error("[Expense Approve API] Error:", e);
    return serverErrorResponse();
  }
}
