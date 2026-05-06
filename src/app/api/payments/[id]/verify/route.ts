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
    const { action, verifiedBy } = body;

    if (!action || !verifiedBy) {
      return errorResponse("action and verifiedBy are required");
    }

    if (!["VERIFY", "REJECT"].includes(action)) {
      return errorResponse("Action must be VERIFY or REJECT");
    }

    const payment = await db.payment.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!payment) {
      return notFoundResponse("Payment not found");
    }

    if (payment.status !== "PENDING") {
      return errorResponse("Payment is not in PENDING status");
    }

    const newStatus = action === "VERIFY" ? "VERIFIED" : "REJECTED";

    const updatedPayment = await db.payment.update({
      where: { id },
      data: {
        status: newStatus,
        verifiedBy,
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

    // If it's a membership payment that was verified, update user status
    if (action === "VERIFY" && payment.type === "MEMBERSHIP" && payment.user.membershipStatus === "NON_MEMBER") {
      await db.user.update({
        where: { id: payment.userId },
        data: { membershipStatus: "PENDING" },
      });
    }

    // Create notification
    await db.notification.create({
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
    await db.auditLog.create({
      data: {
        userId: verifiedBy,
        action: `PAYMENT_${action === "VERIFY" ? "VERIFIED" : "REJECTED"}`,
        details: `${action === "VERIFY" ? "Verified" : "Rejected"} payment of ${payment.amount} from ${payment.user.name} (${payment.user.email}). Transaction ID: ${payment.transactionId}`,
      },
    });

    return successResponse({ payment: updatedPayment });
  } catch {
    return serverErrorResponse();
  }
}
