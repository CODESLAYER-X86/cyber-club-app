import { db } from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return errorResponse("userId is required");
    }

    const event = await db.event.findUnique({ where: { id } });
    if (!event) {
      return notFoundResponse("Event not found");
    }

    // Check if event is cancelled
    if (event.status === "CANCELLED") {
      return errorResponse("Cannot register for a cancelled event");
    }

    // Check if already registered
    const existing = await db.eventRegistration.findUnique({
      where: { userId_eventId: { userId, eventId: id } },
    });

    if (existing) {
      return errorResponse("Already registered for this event");
    }

    // Check seat availability for LIMITED type
    if (event.type === "LIMITED" && event.maxSeats && event.currentSeats >= event.maxSeats) {
      return errorResponse("Event is fully booked");
    }

    // Check membership for MEMBER_ONLY type
    if (event.type === "MEMBER_ONLY") {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.membershipStatus !== "ACTIVE") {
        return errorResponse("Only active members can register for this event");
      }
    }

    const registration = await db.eventRegistration.create({
      data: {
        userId,
        eventId: id,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    // Increment current seats
    await db.event.update({
      where: { id },
      data: { currentSeats: { increment: 1 } },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: "Event Registration",
        message: `You have registered for "${event.title}". Your registration is pending approval.`,
        type: "INFO",
      },
    });

    return successResponse({ registration }, 201);
  } catch {
    return serverErrorResponse();
  }
}
