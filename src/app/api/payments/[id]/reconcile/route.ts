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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params;
    const body = await request.json();
    const { description } = body;

    // Enforce role authorization
    const caller = await getSupabaseUser(AUTHORIZED_ROLES);
    if (!caller) {
      return forbiddenResponse("Only Treasurer, President, or Platform Admin can reconcile payments");
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
      return errorResponse("Only verified payments can be reconciled");
    }

    // Create audit log for reconciliation
    await prisma.auditLog.create({
      data: {
        userId: caller.userId,
        action: "PAYMENT_RECONCILED",
        details: JSON.stringify({
          paymentId,
          amount: payment.amount,
          description: description.trim(),
        }),
      },
    });

    return successResponse({ paymentId, reconciled: true });
  } catch (e) {
    console.error("[Reconcile API] Error:", e);
    return serverErrorResponse();
  }
}
