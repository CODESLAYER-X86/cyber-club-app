import prisma from "@/lib/db";
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";
import { isSafeUrl } from "@/lib/utils";

const UPLOAD_ROLES = ["MEDIA", "PRESIDENT", "PLATFORM_ADMIN", "GS"];

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

    const galleryImages = await prisma.galleryImage.findMany({
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
    const caller = await getSupabaseUser(UPLOAD_ROLES);
    if (!caller) {
      return forbiddenResponse("Only MEDIA, PRESIDENT, GS, or PLATFORM_ADMIN can upload gallery images");
    }

    const body = await request.json();
    const { title, imageUrl, description, category, eventId } = body;

    if (!title || !imageUrl) {
      return errorResponse("title and imageUrl are required");
    }

    if (!isSafeUrl(imageUrl)) {
      return errorResponse("Invalid or unsafe imageUrl");
    }

    if (eventId) {
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
        return notFoundResponse("Event not found");
      }
    }

    const galleryImage = await prisma.galleryImage.create({
      data: {
        title,
        imageUrl,
        uploadedBy: caller.userId,
        description,
        category: category || "EVENT",
        eventId: eventId || null,
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
