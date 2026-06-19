import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return errorResponse("action is required");
    }

    if (!["VERIFY", "REJECT"].includes(action)) {
      return errorResponse("Action must be VERIFY or REJECT");
    }

    // Authenticate and authorize the caller
    const caller = await getSupabaseUser(["TREASURER", "PRESIDENT", "GS", "PLATFORM_ADMIN"]);
    if (!caller) {
      return forbiddenResponse("Only Treasurer, President, General Secretary, and Platform Admin can verify payments");
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!payment) {
      return notFoundResponse("Payment not found");
    }

    if (payment.status !== "PENDING" && payment.status !== "APPROVED") {
      return errorResponse("Payment is not in PENDING or APPROVED status");
    }

    const newStatus = action === "VERIFY" ? "VERIFIED" : "REJECTED";

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: newStatus,
        verifiedBy: caller.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        title: action === "VERIFY" ? "Payment Verified" : "Payment Rejected",
        message:
          action === "VERIFY"
            ? `Your payment of ${payment.amount} has been verified.`
            : `Your payment of ${payment.amount} has been rejected. Please contact the treasurer for more information.`,
        type: action === "VERIFY" ? "SUCCESS" : "WARNING",
      },
    });

    // Log to audit log
    await prisma.auditLog.create({
      data: {
        userId: caller.userId,
        action: `PAYMENT_${action === "VERIFY" ? "VERIFIED" : "REJECTED"}`,
        details: `${action === "VERIFY" ? "Verified" : "Rejected"} payment of ${payment.amount} from ${payment.user.name} (${payment.user.email}). Transaction ID: ${payment.transactionId}`,
      },
    });

    return successResponse({ payment: updatedPayment });
  } catch (error) {
    console.error("Verify payment API error:", error);
    return serverErrorResponse();
  }
}
