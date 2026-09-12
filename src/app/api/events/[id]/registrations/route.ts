import prisma from "@/lib/db";
import { successResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("You must be logged in to view registrations");
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, status: true, verifierId: true, createdBy: true },
    });

    if (!event) {
      return notFoundResponse("Event not found");
    }

    const isAuthorized = ["PLATFORM_ADMIN", "PRESIDENT", "VP", "GS", "TREASURER", "VERIFIER"].includes(caller.role) ||
      caller.userId === event.verifierId ||
      caller.userId === event.createdBy;

    if (!isAuthorized) {
      return forbiddenResponse("Only event administrators and verifiers can view the full registration roster");
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
            studentId: true,
            rollNumber: true,
            batch: true,
            phone: true,
            role: true,
            membershipStatus: true,
          },
        },
      },
      orderBy: { registeredAt: "desc" },
    });

    return successResponse({ registrations });
  } catch {
    return serverErrorResponse();
  }
}
