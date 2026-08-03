import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const { id: eventId, regId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return errorResponse("status is required");
    }

    if (!["APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
      return errorResponse("Invalid status. Must be APPROVED, REJECTED, or CANCELLED");
    }

    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("Unauthorized");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return notFoundResponse("Event not found");
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: regId },
      include: { user: true, event: true },
    });

    if (!registration) {
      return notFoundResponse("Registration not found");
    }

    if (registration.eventId !== eventId) {
      return errorResponse("Registration does not belong to this event");
    }

    // Permission check:
    // 1. Admins or Verifiers (PLATFORM_ADMIN, PRESIDENT, VP, GS, TREASURER, VERIFIER) can update any registration
    const ALLOWED_ROLES = ["PLATFORM_ADMIN", "PRESIDENT", "VP", "GS", "TREASURER", "VERIFIER"];
    const isAuthorizedRole = ALLOWED_ROLES.includes(caller.role);
    
    // 2. Designated verifier or event creator can update registration
    const isDesignatedVerifier = event.verifierId === caller.userId || event.createdBy === caller.userId;

    if (!isAuthorizedRole && !isDesignatedVerifier) {
      return forbiddenResponse("You do not have permission to update registration status");
    }

    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: regId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            membershipStatus: true,
          },
        },
      },
    });

    // If registration is approved, also update the associated payment to APPROVED status (not VERIFIED)
    if (status === "APPROVED") {
      const payment = await prisma.payment.findFirst({
        where: { userId: registration.userId, eventId, status: "PENDING" },
      });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "APPROVED", verifiedBy: caller.userId },
        });
      }
    }

    // If registration is cancelled/rejected, decrement current seats
    if ((status === "CANCELLED" || status === "REJECTED") && registration.status === "APPROVED") {
      await prisma.event.update({
        where: { id: eventId },
        data: { currentSeats: { decrement: 1 } },
      });
    }

    if (status === "CANCELLED" || status === "REJECTED") {
      const payment = await prisma.payment.findFirst({
        where: { userId: registration.userId, eventId, status: { in: ["PENDING", "APPROVED"] } },
      });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "REJECTED", verifiedBy: caller.userId },
        });
      }
    }

    // Create notification for the user
    const statusMessages: Record<string, string> = {
      APPROVED: `Your registration for "${registration.event.title}" has been approved!`,
      REJECTED: `Your registration for "${registration.event.title}" has been rejected. Please contact an administrator for more information.`,
      CANCELLED: `Your registration for "${registration.event.title}" has been cancelled.`,
    };

    await prisma.notification.create({
      data: {
        userId: registration.userId,
        title: "Registration Update",
        message: statusMessages[status] || `Your registration status has been updated to ${status}.`,
        type: status === "APPROVED" ? "SUCCESS" : "WARNING",
      },
    });

    return successResponse({ registration: updatedRegistration });
  } catch (error) {
    console.error("Update registration API error:", error);
    return serverErrorResponse();
  }
}
