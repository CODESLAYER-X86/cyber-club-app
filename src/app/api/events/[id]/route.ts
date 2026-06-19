import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

const DELETE_ROLES = ["PRESIDENT", "PLATFORM_ADMIN", "MEDIA", "VP", "GS"];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const role = body.role as string | undefined;

    // Only authorized roles can delete events
    if (!role || !DELETE_ROLES.includes(role)) {
      return errorResponse("You do not have permission to delete events", 403);
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return notFoundResponse("Event not found");
    }

    // Delete related records first (in correct dependency order)
    // 1. Certificate audit logs (depend on certificates)
    const eventCertificates = await prisma.certificate.findMany({ where: { eventId: id }, select: { id: true } });
    if (eventCertificates.length > 0) {
      await prisma.certificateAuditLog.deleteMany({
        where: { certificateId: { in: eventCertificates.map(c => c.id) } },
      });
    }
    // 2. Certificates
    await prisma.certificate.deleteMany({ where: { eventId: id } });
    // 3. Assessment submissions (depend on assessments)
    const eventAssessments = await prisma.assessment.findMany({ where: { eventId: id }, select: { id: true } });
    if (eventAssessments.length > 0) {
      await prisma.assessmentSubmission.deleteMany({
        where: { assessmentId: { in: eventAssessments.map(a => a.id) } },
      });
    }
    // 4. Assessments
    await prisma.assessment.deleteMany({ where: { eventId: id } });
    // 5. Attendance
    await prisma.attendance.deleteMany({ where: { eventId: id } });
    // 6. Registrations
    await prisma.eventRegistration.deleteMany({ where: { eventId: id } });
    // 7. Gallery images (unlink, don't delete the images themselves)
    await prisma.galleryImage.updateMany({ where: { eventId: id }, data: { eventId: null } });
    // 8. Payments (unlink, don't delete payment records)
    await prisma.payment.updateMany({ where: { eventId: id }, data: { eventId: null } });
    // 9. Finally, delete the event
    await prisma.event.delete({ where: { id } });

    return successResponse({ message: "Event deleted successfully" });
  } catch {
    return serverErrorResponse();
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        registrations: {
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
          orderBy: { registeredAt: "desc" },
        },
        attendance: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        certificates: true,
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return notFoundResponse("Event not found");
    }

    // Fetch payments for this event to link transactionId/payment info
    const payments = await prisma.payment.findMany({
      where: { eventId: id },
    });

    const registrationsWithPayment = event.registrations.map((reg) => {
      const payment = payments.find((p) => p.userId === reg.userId);
      return {
        ...reg,
        payment: payment
          ? {
              id: payment.id,
              amount: payment.amount,
              status: payment.status,
              transactionId: payment.transactionId,
              proofUrl: payment.proofUrl,
              createdAt: payment.createdAt,
            }
          : null,
      };
    });

    const eventWithPayments = {
      ...event,
      registrations: registrationsWithPayment,
    };

    return successResponse({ event: eventWithPayments });
  } catch {
    return serverErrorResponse();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return notFoundResponse("Event not found");
    }

    const allowedFields = [
      "title",
      "description",
      "type",
      "category",
      "startDate",
      "endDate",
      "venue",
      "fee",
      "maxSeats",
      "poster",
      "status",
      "requiresAssessment",
      "passingScore",
      "verifierId",
      "certificateLayout",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "startDate" || field === "endDate") {
          data[field] = new Date(body[field]);
        } else {
          data[field] = body[field];
        }
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (body.status === "COMPLETED" && event.status !== "COMPLETED") {
      // Fetch all attendance records for this event that are PRESENT or LATE
      const presentAttendance = await prisma.attendance.findMany({
        where: { eventId: id, status: { in: ["PRESENT", "LATE"] } },
        select: { userId: true },
      });

      const userIds = presentAttendance.map((a) => a.userId);

      if (userIds.length > 0) {
        // Fetch registrations to see who is APPROVED
        const approvedRegistrations = await prisma.eventRegistration.findMany({
          where: { eventId: id, userId: { in: userIds }, status: "APPROVED" },
          select: { userId: true },
        });
        const approvedUserIds = new Set(approvedRegistrations.map((r) => r.userId));

        // If assessment is required, check who passed
        let eligibleUserIds = userIds.filter((uid) => approvedUserIds.has(uid));

        if (updatedEvent.requiresAssessment && updatedEvent.passingScore !== null && updatedEvent.passingScore !== undefined) {
          const assessments = await prisma.assessment.findMany({
            where: { eventId: id },
            select: { id: true },
          });

          if (assessments.length > 0) {
            const assessmentIds = assessments.map((a) => a.id);
            // Find who passed
            const passingSubmissions = await prisma.assessmentSubmission.findMany({
              where: {
                assessmentId: { in: assessmentIds },
                userId: { in: eligibleUserIds },
                status: "GRADED",
                score: { gte: updatedEvent.passingScore },
              },
              select: { userId: true },
            });
            const passedUserIds = new Set(passingSubmissions.map((s) => s.userId));
            eligibleUserIds = eligibleUserIds.filter((uid) => passedUserIds.has(uid));
          } else {
            // No assessments created yet, so they are not eligible
            eligibleUserIds = [];
          }
        }

        if (eligibleUserIds.length > 0) {
          // Promote certificates for eligible users to ELIGIBLE
          await prisma.certificate.updateMany({
            where: {
              eventId: id,
              userId: { in: eligibleUserIds },
              status: { in: ["REGISTERED", "PRESENT"] },
            },
            data: { status: "ELIGIBLE" },
          });
        }
      }
    }

    return successResponse({ event: updatedEvent });
  } catch {
    return serverErrorResponse();
  }
}
