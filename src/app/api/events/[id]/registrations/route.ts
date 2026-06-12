import prisma from "@/lib/db";
import { successResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, status: true },
    });

    if (!event) {
      return notFoundResponse("Event not found");
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
            role: true,
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
