import { db } from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await db.event.findUnique({
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

    const event = await db.event.findUnique({ where: { id } });
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

    const updatedEvent = await db.event.update({
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
