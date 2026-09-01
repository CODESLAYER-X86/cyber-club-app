import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, transactionId, paymentMethod = "BKASH" } = body;

    if (!userId) {
      return errorResponse("userId is required", 400);
    }

    // Step 1: Pre-validation checks
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return notFoundResponse("Event not found");
    }

    if (event.status === "CANCELLED") {
      return errorResponse("Cannot register for a cancelled event", 400);
    }

    // Check membership for MEMBER_ONLY type
    if (event.type === "MEMBER_ONLY") {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.membershipStatus !== "ACTIVE") {
        return errorResponse("Only active members can register for this event", 403);
      }
    }

    // For PAID events, require transaction ID
    if (event.fee > 0 && !transactionId) {
      return errorResponse("Transaction ID is required for paid events", 400);
    }

    const registrationStatus = event.fee > 0 ? "PENDING" : "APPROVED";
    const certificateCode = `CSC-2026-${event.category || "EVENT"}-${uuidv4().split("-")[0].toUpperCase()}`;
    const VALID_METHODS = ["BKASH", "NAGAD", "BANK", "CASH"];
    const validatedMethod = VALID_METHODS.includes(paymentMethod) ? paymentMethod : "BKASH";

    // Step 2: Atomic Transaction execution (prevents race condition & overselling)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atomic seat increment with conditional capacity check
      if (event.type === "LIMITED" && event.maxSeats) {
        const updateResult = await tx.event.updateMany({
          where: {
            id,
            currentSeats: { lt: event.maxSeats },
          },
          data: {
            currentSeats: { increment: 1 },
          },
        });

        if (updateResult.count === 0) {
          throw new Error("EVENT_FULLY_BOOKED");
        }
      } else {
        await tx.event.update({
          where: { id },
          data: { currentSeats: { increment: 1 } },
        });
      }

      // 2. Create registration record (unique constraint on userId + eventId prevents double clicks)
      const registration = await tx.eventRegistration.create({
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

      // 3. Create certificate record in REGISTERED status
      await tx.certificate.create({
        data: {
          certificateCode,
          userId,
          eventId: id,
          type: "PARTICIPATION",
          status: "REGISTERED",
        },
      });

      // 4. Create payment record if paid
      let payment: unknown = null;
      if (event.fee > 0 && transactionId) {
        payment = await tx.payment.create({
          data: {
            userId,
            amount: event.fee,
            type: "EVENT",
            status: "PENDING",
            transactionId,
            paymentMethod: validatedMethod,
            eventId: id,
          },
        });
      }

      // 5. Create notification
      const notificationMessage =
        event.fee > 0
          ? `You have registered for "${event.title}". Your payment (৳${event.fee}) is pending verification.`
          : `You have registered for "${event.title}". Your registration has been approved!`;

      await tx.notification.create({
        data: {
          userId,
          title: "Event Registration",
          message: notificationMessage,
          type: event.fee > 0 ? "INFO" : "SUCCESS",
        },
      });

      return { registration, payment };
    });

    return successResponse(result, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "EVENT_FULLY_BOOKED") {
      return errorResponse("Event is fully booked", 409);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse("Already registered for this event", 409);
    }
    console.error("Event registration error:", error);
    return serverErrorResponse();
  }
}
