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

    return successResponse({ event });
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

    return successResponse({ event: updatedEvent });
  } catch {
    return serverErrorResponse();
  }
}
