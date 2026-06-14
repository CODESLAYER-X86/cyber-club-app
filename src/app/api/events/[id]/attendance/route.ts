import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

const AUTHORIZED_ROLES = ["PLATFORM_ADMIN", "PRESIDENT", "VP", "GS", "VERIFIER"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { userId, status, verifierRole, verifierId } = body;

    if (!userId || !status) {
      return errorResponse("userId and status are required");
    }

    if (!["PRESENT", "ABSENT", "LATE"].includes(status)) {
      return errorResponse("status must be PRESENT, ABSENT, or LATE");
    }

    if (!verifierRole || !AUTHORIZED_ROLES.includes(verifierRole)) {
      return errorResponse("You are not authorized to mark attendance", 403);
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return notFoundResponse("Event not found");
    }

    // 1. Create or update Attendance record
    const attendance = await prisma.attendance.upsert({
      where: {
        userId_eventId: { userId, eventId },
      },
      update: {
        status,
        markedAt: new Date(),
      },
      create: {
        userId,
        eventId,
        status,
      },
    });

    // 2. Fetch corresponding Certificate
    let certificate = await prisma.certificate.findFirst({
      where: { userId, eventId },
    });

    if (certificate) {
      let newStatus = certificate.status;

      if (status === "PRESENT" || status === "LATE") {
        newStatus = "PRESENT";

        // 3. Perform eligibility checks to see if we can promote it to ELIGIBLE
        // Check registration approval
        const registration = await prisma.eventRegistration.findUnique({
          where: { userId_eventId: { userId, eventId } },
        });
        const regApproved = registration?.status === "APPROVED";

        // Check assessment if required
        let assessmentPassed = true;
        if (event.requiresAssessment && event.passingScore !== null && event.passingScore !== undefined) {
          assessmentPassed = false;
          const assessments = await prisma.assessment.findMany({
            where: { eventId },
            select: { id: true },
          });

          if (assessments.length > 0) {
            const assessmentIds = assessments.map((a) => a.id);
            const passingSubmission = await prisma.assessmentSubmission.findFirst({
              where: {
                userId,
                assessmentId: { in: assessmentIds },
                status: "GRADED",
                score: { gte: event.passingScore },
              },
            });
            assessmentPassed = !!passingSubmission;
          }
        }

        // If event is completed, and user is registered, present, and passed assessment -> ELIGIBLE
        if (event.status === "COMPLETED" && regApproved && assessmentPassed) {
          newStatus = "ELIGIBLE";
        }
      } else {
        // If absent, reset certificate back to REGISTERED
        newStatus = "REGISTERED";
      }

      certificate = await prisma.certificate.update({
        where: { id: certificate.id },
        data: { status: newStatus },
      });
    }

    return successResponse({ attendance, certificate });
  } catch (error) {
    console.error("Attendance API Error:", error);
    return serverErrorResponse();
  }
}
