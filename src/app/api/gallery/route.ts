import { db } from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const eventId = searchParams.get("eventId");

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    if (eventId) {
      where.eventId = eventId;
    }

    const galleryImages = await db.galleryImage.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ galleryImages });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, imageUrl, uploadedBy, description, category, eventId } = body;

    if (!title || !imageUrl || !uploadedBy) {
      return errorResponse("title, imageUrl, and uploadedBy are required");
    }

    const galleryImage = await db.galleryImage.create({
      data: {
        title,
        imageUrl,
        uploadedBy,
        description,
        category: category || "EVENT",
        eventId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatar: true,
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

    return successResponse({ galleryImage }, 201);
  } catch {
    return serverErrorResponse();
  }
}
