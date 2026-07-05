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

const AUTHORIZED_ROLES = ["TREASURER", "PRESIDENT", "PLATFORM_ADMIN"];
const VALID_WALLETS = ["BKASH_PERSONAL", "NAGAD_PERSONAL", "CLUB_BANK_ACCOUNT", "CASH_IN_HAND"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params;
    const body = await request.json();
    const { wallet, description } = body;

    // Enforce role authorization
    const caller = await getSupabaseUser(AUTHORIZED_ROLES);
    if (!caller) {
      return forbiddenResponse("Only Treasurer, President, or Platform Admin can reconcile payments");
    }

    if (!wallet || !VALID_WALLETS.includes(wallet)) {
      return errorResponse(`Invalid wallet. Must be one of: ${VALID_WALLETS.join(", ")}`);
    }

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return errorResponse("A reconciliation description is required");
    }

    // Check payment status
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return notFoundResponse("Payment record not found");
    }

    if (payment.status !== "VERIFIED") {
      return errorResponse("Only verified payments can be posted to the ledger");
    }

    // Check if already reconciled
    const existingLedger = await prisma.ledgerEntry.findFirst({
      where: { referenceId: paymentId },
    });

    if (existingLedger) {
      return errorResponse("This payment has already been posted to the ledger");
    }

    // Create ledger entry in a transaction
    const ledgerEntry = await prisma.$transaction(async (tx) => {
      return tx.ledgerEntry.create({
        data: {
          type: "CREDIT",
          amount: payment.amount,
          wallet,
          description: description.trim(),
          referenceId: paymentId,
          performedBy: caller.userId,
        },
      });
    });

    return successResponse({ ledgerEntry });
  } catch (e) {
    console.error("[Reconcile API] Error:", e);
    return serverErrorResponse();
  }
}
