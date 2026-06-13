import prisma from "@/lib/db";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/api-utils";
import { getSupabaseUser } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

const ALLOWED_ROLES = ["MEDIA", "PRESIDENT", "PLATFORM_ADMIN"];

// POST /api/gallery/:eventId/photos — add a gallery image to an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    const caller = await getSupabaseUser(ALLOWED_ROLES);
    if (!caller) return forbiddenResponse("Only MEDIA, PRESIDENT, or PLATFORM_ADMIN can add photos");

    const body = await request.json();
    const { imageUrl, title, description, category } = body;

    if (!imageUrl || !title) {
      return errorResponse("imageUrl and title are required");
    }

    // Verify event exists (the :id here is the event the photos belong to)
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return notFoundResponse("Event not found");
    }

    const photo = await prisma.galleryImage.create({
      data: {
        imageUrl,
        title,
        description: description || null,
        category: category || "EVENT",
        eventId,
        uploadedBy: caller.userId,
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
    });

    return successResponse({ photo }, 201);
  } catch {
    return serverErrorResponse();
  }
}

// GET /api/gallery/:eventId/photos — list photos for an event
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const photos = await prisma.galleryImage.findMany({
      where: { eventId },
      include: {
        uploader: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return successResponse({ photos });
  } catch {
    return serverErrorResponse();
  }
}
