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
    const { preferredName, studentId, department, institution } = body;

    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("Unauthorized");
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: regId },
      include: { event: true },
    });

    if (!registration) {
      return notFoundResponse("Registration not found");
    }

    // Cryptographic auth check: Caller must own the registration OR be an executive/admin
    const isOwner = registration.userId === caller.userId;
    const isAdmin = ["PLATFORM_ADMIN", "PRESIDENT", "VP", "GS"].includes(caller.role);

    if (!isOwner && !isAdmin) {
      return forbiddenResponse("You are not authorized to edit this information");
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
