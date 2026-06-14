import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, transactionId } = body;

    if (!userId) {
      return errorResponse("userId is required");
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return notFoundResponse("Event not found");
    }

    // Check if event is cancelled
    if (event.status === "CANCELLED") {
      return errorResponse("Cannot register for a cancelled event");
    }

    // Check if already registered
    const existing = await prisma.eventRegistration.findUnique({
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
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.membershipStatus !== "ACTIVE") {
        return errorResponse("Only active members can register for this event");
      }
    }

    // For PAID events, require transaction ID
    if (event.fee > 0 && !transactionId) {
      return errorResponse("Transaction ID is required for paid events");
    }

    // Determine registration status: free events auto-approve, paid events stay pending until payment verified
    const registrationStatus = event.fee > 0 ? "PENDING" : "APPROVED";

    const registration = await prisma.eventRegistration.create({
      data: {
        userId,
        eventId: id,
        status: registrationStatus,
      },
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
    await prisma.event.update({
      where: { id },
      data: { currentSeats: { increment: 1 } },
    });

    // Create dynamic certificate code and a Certificate record in REGISTERED status
    const certificateCode = `CSC-2026-${event.category || "EVENT"}-${uuidv4().split("-")[0].toUpperCase()}`;
    await prisma.certificate.create({
      data: {
        certificateCode,
        userId,
        eventId: id,
        type: "PARTICIPATION",
        status: "REGISTERED",
      },
    });

    // For PAID events, create a Payment record so it appears in Verify Payments
    let payment: unknown = null;
    if (event.fee > 0 && transactionId) {
      payment = await prisma.payment.create({
        data: {
          userId,
          amount: event.fee,
          type: "EVENT",
          status: "PENDING",
          transactionId,
          eventId: id,
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
            },
          },
        },
      });
    }

    // Create notification
    const notificationMessage = event.fee > 0
      ? `You have registered for "${event.title}". Your payment (৳${event.fee}) is pending verification. You'll be approved once payment is confirmed.`
      : `You have registered for "${event.title}". Your registration has been approved!`;

    await prisma.notification.create({
      data: {
        userId,
        title: "Event Registration",
        message: notificationMessage,
        type: event.fee > 0 ? "INFO" : "SUCCESS",
      },
    });

    return successResponse({ registration, payment }, 201);
  } catch {
    return serverErrorResponse();
  }
}
