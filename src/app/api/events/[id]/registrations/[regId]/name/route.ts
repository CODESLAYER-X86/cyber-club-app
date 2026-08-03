import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const { id: eventId, regId } = await params;
    const body = await request.json();
    const { preferredName, studentId, department, institution, requestingUserId, requestingUserRole } = body;

    if (!requestingUserId) {
      return errorResponse("requestingUserId is required");
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: regId },
      include: { event: true },
    });

    if (!registration) {
      return notFoundResponse("Registration not found");
    }

    // Auth check: User must own the registration OR be an executive/admin
    const isOwner = registration.userId === requestingUserId;
    const isAdmin = ["PLATFORM_ADMIN", "PRESIDENT", "VP", "GS"].includes(requestingUserRole);

    if (!isOwner && !isAdmin) {
      return errorResponse("You are not authorized to edit this information", 403);
    }

    // Lifecycle check: Once Authorized or Generated, name is locked
    const certificate = await prisma.certificate.findFirst({
      where: { userId: registration.userId, eventId },
    });

    if (certificate && ["AUTHORIZED", "GENERATED", "DOWNLOADED"].includes(certificate.status)) {
      return errorResponse("Certificate has already been authorized or generated. Information is locked.");
    }

    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: regId },
      data: {
        preferredName,
        studentId,
        department,
        institution,
      },
    });

    return successResponse({ registration: updatedRegistration });
  } catch (error) {
    console.error("Preferred Name Update API Error:", error);
    return serverErrorResponse();
  }
}
