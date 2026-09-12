import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { userId, preferredName, studentId, department, institution } = body;

    if (!userId) {
      return errorResponse("userId is required", 400);
    }

    // Auth verification: ensure user is updating their own certificate info or is admin
    const caller = await getSupabaseUser();
    if (!caller) {
      return errorResponse("Unauthorized", 401);
    }
    if (caller.userId !== userId && caller.role !== "PLATFORM_ADMIN") {
      return errorResponse("Forbidden: You cannot modify another user's certificate info", 403);
    }

    // Verify registration exists
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (!registration) {
      return notFoundResponse("Registration for this event was not found");
    }

    // Check if certificate is already finalized/generated
    const certificate = await prisma.certificate.findFirst({
      where: {
        userId,
        eventId,
      },
    });

    if (certificate && ["AUTHORIZED", "GENERATED", "DOWNLOADED"].includes(certificate.status)) {
      return errorResponse("Certificate info is locked because the certificate has already been generated.", 400);
    }

    // Update the EventRegistration record with preferred certificate info
    const updated = await prisma.eventRegistration.update({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      data: {
        preferredName: preferredName ? String(preferredName).trim().slice(0, 100) : null,
        studentId: studentId ? String(studentId).trim().slice(0, 30) : null,
        department: department ? String(department).trim().slice(0, 100) : null,
        institution: institution ? String(institution).trim().slice(0, 150) : null,
      },
    });

    // Also update user profile defaults if provided
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(studentId && { studentId: String(studentId).trim().slice(0, 30) }),
        ...(department && { department: String(department).trim().slice(0, 100) }),
      },
    }).catch(() => {
      // Ignore user profile update failure if minor
    });

    return successResponse({ registration: updated, message: "Certificate information updated successfully" }, 200);
  } catch (error: any) {
    console.error("[preferred-name route] Error updating certificate info:", error);
    return serverErrorResponse(error);
  }
}
