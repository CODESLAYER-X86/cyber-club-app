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
    const caller = await getSupabaseUser(["TREASURER", "PRESIDENT", "GS", "PLATFORM_ADMIN", "VERIFIER"]);
    if (!caller) {
      return forbiddenResponse("Only Treasurer, President, General Secretary, Platform Admin, and Event Verifiers can verify payments");
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!payment) {
      return notFoundResponse("Payment not found");
    }

    // Role-specific checks:
    // If VERIFIER:
    // 1. Can only verify/reject EVENT payments.
    // 2. Can only verify PENDING payments (to APPROVED).
    if (caller.role === "VERIFIER") {
      if (payment.type !== "EVENT") {
        return forbiddenResponse("Event Verifiers can only verify event payments");
      }
      if (payment.status !== "PENDING") {
        return errorResponse("Payment is not in PENDING status");
      }
    } else {
      // Treasurer/Admin can verify PENDING or APPROVED payments
      if (payment.status !== "PENDING" && payment.status !== "APPROVED") {
        return errorResponse("Payment is not in PENDING or APPROVED status");
      }
    }

    // Determine target status
    let newStatus = payment.status;
    if (action === "VERIFY") {
      if (caller.role === "VERIFIER") {
        newStatus = "APPROVED";
      } else {
        newStatus = "VERIFIED";
      }
    } else {
      newStatus = "REJECTED";
    }

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

    // If payment is for an event, we need to update the corresponding event registration status
    if (payment.type === "EVENT" && payment.eventId) {
      const regStatus = newStatus === "APPROVED" || newStatus === "VERIFIED" ? "APPROVED" : "REJECTED";
      // Find and update registration
      const registration = await prisma.eventRegistration.findFirst({
        where: { userId: payment.userId, eventId: payment.eventId },
      });
      if (registration) {
        await prisma.eventRegistration.update({
          where: { id: registration.id },
          data: { status: regStatus },
        });

        // If registration is rejected, and it was approved previously, handle seat count
        if (regStatus === "REJECTED" && registration.status === "APPROVED") {
          await prisma.event.update({
            where: { id: payment.eventId },
            data: { currentSeats: { decrement: 1 } },
          });
        }
      }
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        title: newStatus === "VERIFIED" ? "Payment Verified" : newStatus === "APPROVED" ? "Payment Approved" : "Payment Rejected",
        message:
          newStatus === "VERIFIED"
            ? `Your payment of ${payment.amount} has been verified.`
            : newStatus === "APPROVED"
            ? `Your payment of ${payment.amount} has been approved by the event verifier.`
            : `Your payment of ${payment.amount} has been rejected. Please contact the treasurer/verifier for more information.`,
        type: newStatus === "VERIFIED" || newStatus === "APPROVED" ? "SUCCESS" : "WARNING",
      },
    });

    // Log to audit log
    await prisma.auditLog.create({
      data: {
        userId: caller.userId,
        action: `PAYMENT_${newStatus}`,
        details: `${newStatus === "VERIFIED" ? "Verified" : newStatus === "APPROVED" ? "Approved" : "Rejected"} payment of ${payment.amount} from ${payment.user.name} (${payment.user.email}). Transaction ID: ${payment.transactionId}`,
      },
    });

    return successResponse({ payment: updatedPayment });
  } catch (error) {
    console.error("Verify payment API error:", error);
    return serverErrorResponse();
  }
}
