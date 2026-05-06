import { db } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/api-utils";
import { NextRequest } from "next/server";

const ALLOWED_ROLES = ["MEDIA", "PRESIDENT", "PLATFORM_ADMIN"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { url, caption, createdBy } = body;

    if (!url || !createdBy) {
      return errorResponse("url and createdBy are required");
    }

    // RBAC check
    const user = await db.user.findUnique({
      where: { id: createdBy },
      select: { role: true },
    });

    if (!user || !ALLOWED_ROLES.includes(user.role)) {
      return errorResponse("Only MEDIA, PRESIDENT, or PLATFORM_ADMIN can add photos", 403);
    }

    const album = await db.galleryAlbum.findUnique({ where: { id } });
    if (!album) {
      return notFoundResponse("Album not found");
    }

    const photo = await db.galleryPhoto.create({
      data: {
        albumId: id,
        url,
        caption: caption || null,
        createdBy,
      },
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
      },
    });

    return successResponse({ photo }, 201);
  } catch {
    return serverErrorResponse();
  }
}
