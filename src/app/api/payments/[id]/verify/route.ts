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
    // 2. Can verify PENDING or re-verify REJECTED payments (to APPROVED).
    // 3. Can reject PENDING or revoke APPROVED payments.
    // 4. Cannot modify payments that have already been reconciled/VERIFIED by the Treasurer.
    if (caller.role === "VERIFIER") {
      if (payment.type !== "EVENT") {
        return forbiddenResponse("Event Verifiers can only verify event payments");
      }
      if (payment.status === "VERIFIED") {
        return errorResponse("This payment has already been verified and reconciled by the Treasurer and cannot be modified.");
      }
      if (action === "VERIFY") {
        if (!["PENDING", "REJECTED"].includes(payment.status)) {
          return errorResponse(`Payment is already ${payment.status.toLowerCase()}`);
        }
      } else if (action === "REJECT") {
        if (!["PENDING", "APPROVED"].includes(payment.status)) {
          return errorResponse(`Payment is already ${payment.status.toLowerCase()}`);
        }
      }
    } else {
      // Treasurer/Admin/President/GS can verify, re-evaluate, or reject payments in any status to correct mistakes
      if (!["PENDING", "APPROVED", "REJECTED", "VERIFIED"].includes(payment.status)) {
        return errorResponse("Invalid payment status");
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

    // Pre-check capacity if re-verifying a previously rejected event registration
    let existingRegistration: { id: string; status: string } | null = null;
    if (payment.type === "EVENT" && payment.eventId) {
      existingRegistration = await prisma.eventRegistration.findFirst({
        where: { userId: payment.userId, eventId: payment.eventId },
        select: { id: true, status: true },
      });

      const isReapproving = (newStatus === "APPROVED" || newStatus === "VERIFIED") && existingRegistration?.status === "REJECTED";
      if (isReapproving) {
        const event = await prisma.event.findUnique({
          where: { id: payment.eventId },
          select: { maxSeats: true, currentSeats: true },
        });
        if (event && event.maxSeats && event.maxSeats > 0 && event.currentSeats >= event.maxSeats) {
          return errorResponse("Event is fully booked. Cannot re-approve registration.", 409);
        }
      }
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
          },
        },
      },
    });

    // If payment is for an event, sync event registration status and handle seat count
    if (payment.type === "EVENT" && payment.eventId && existingRegistration) {
      const regStatus = newStatus === "APPROVED" || newStatus === "VERIFIED" ? "APPROVED" : "REJECTED";

      // If registration is becoming REJECTED from PENDING or APPROVED, release the seat
      if (regStatus === "REJECTED" && (existingRegistration.status === "APPROVED" || existingRegistration.status === "PENDING")) {
        await prisma.event.update({
          where: { id: payment.eventId },
          data: { currentSeats: { decrement: 1 } },
        });
      }
      // If registration was REJECTED and is now APPROVED (re-verified), reclaim the seat
      else if (regStatus === "APPROVED" && existingRegistration.status === "REJECTED") {
        await prisma.event.update({
          where: { id: payment.eventId },
          data: { currentSeats: { increment: 1 } },
        });
      }

      await prisma.eventRegistration.update({
        where: { id: existingRegistration.id },
        data: { status: regStatus },
      });
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
