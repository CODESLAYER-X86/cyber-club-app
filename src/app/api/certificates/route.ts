import { db } from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    const certificates = await db.certificate.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    return successResponse({ certificates });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, eventId, type = "PARTICIPATION", score } = body;

    if (!userId || !eventId) {
      return errorResponse("userId and eventId are required");
    }

    // Generate unique certificate code
    const certificateCode = `CSC-${uuidv4().split("-")[0].toUpperCase()}-${uuidv4().split("-")[1].toUpperCase()}`;

    const certificate = await db.certificate.create({
      data: {
        certificateCode,
        userId,
        eventId,
        type,
        score,
        status: "VALID",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: "Certificate Issued",
        message: `You have been issued a ${type.toLowerCase()} certificate. Code: ${certificateCode}`,
        type: "SUCCESS",
      },
    });

    return successResponse({ certificate }, 201);
  } catch {
    return serverErrorResponse();
  }
}
