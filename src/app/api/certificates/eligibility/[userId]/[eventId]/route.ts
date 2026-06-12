import prisma from "@/lib/db";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ userId: string; eventId: string }> }
) {
  try {
    const { userId, eventId } = await params;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return notFoundResponse("User not found");
    }

    // Verify event exists and get details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        status: true,
        requiresAssessment: true,
        passingScore: true,
      },
    });

    if (!event) {
      return notFoundResponse("Event not found");
    }

    // Check 1: Event must be COMPLETED
    const eventCompleted = event.status === "COMPLETED";

    // Check 2: User must have APPROVED registration
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });
    const registrationApproved = registration?.status === "APPROVED";

    // Check 3: User must have PRESENT or LATE attendance
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });
    const attendancePresent =
      attendance?.status === "PRESENT" || attendance?.status === "LATE";

    // Check 4: If event requires assessment, user must have graded submission with score >= passingScore
    let assessmentPassed = true; // Default true if no assessment required
    if (event.requiresAssessment) {
      assessmentPassed = false;
      if (event.passingScore !== null && event.passingScore !== undefined) {
        // Find assessments for this event
        const assessments = await prisma.assessment.findMany({
          where: { eventId },
          select: { id: true },
        });

        if (assessments.length > 0) {
          const assessmentIds = assessments.map((a) => a.id);

          // Check if user has a graded submission with passing score
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
    }

    // Check 5: User must NOT already have a certificate for this event
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        userId,
        eventId,
        status: { not: "REVOKED" }, // Revoked certificates don't count
      },
    });
    const noExistingCertificate = !existingCertificate;

    // Overall eligibility
    const eligible =
      eventCompleted &&
      registrationApproved &&
      attendancePresent &&
      assessmentPassed &&
      noExistingCertificate;

    return successResponse({
      eligible,
      checks: {
        eventCompleted,
        registration: registrationApproved,
        attendance: attendancePresent,
        assessment: assessmentPassed,
        existingCertificate: !noExistingCertificate,
      },
      event: {
        title: event.title,
        status: event.status,
        requiresAssessment: event.requiresAssessment,
        passingScore: event.passingScore,
      },
    });
  } catch {
    return serverErrorResponse();
  }
}
