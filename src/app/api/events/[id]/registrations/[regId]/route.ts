import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

const ADMIN_ROLES = ["PLATFORM_ADMIN", "PRESIDENT", "VP", "GS", "TREASURER"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const { id: eventId, regId } = await params;
    const body = await request.json();
    const { status, role } = body;

    if (!status || !role) {
      return errorResponse("status and role are required");
    }

    if (!["APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
      return errorResponse("Invalid status. Must be APPROVED, REJECTED, or CANCELLED");
    }

    if (!ADMIN_ROLES.includes(role)) {
      return errorResponse("You do not have permission to update registration status", 403);
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

    // If registration is cancelled/rejected, decrement current seats
    if ((status === "CANCELLED" || status === "REJECTED") && registration.status === "APPROVED") {
      await prisma.event.update({
        where: { id: eventId },
        data: { currentSeats: { decrement: 1 } },
      });
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
  } catch {
    return serverErrorResponse();
  }
}
