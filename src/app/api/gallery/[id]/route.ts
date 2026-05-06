import { unlink } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

const DELETE_ALLOWED_ROLES = ["MEDIA", "PRESIDENT", "PLATFORM_ADMIN"];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const galleryImage = await db.galleryImage.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { id: true, role: true },
        },
      },
    });

    if (!galleryImage) {
      return notFoundResponse("Gallery image not found");
    }

    // Check authorization - require role in request body or header
    const body = await request.json().catch(() => ({}));
    const requesterRole = body.role as string | undefined;

    if (!requesterRole || !DELETE_ALLOWED_ROLES.includes(requesterRole)) {
      return forbiddenResponse("Only MEDIA, PRESIDENT, or PLATFORM_ADMIN can delete gallery images");
    }

    // Delete the physical file
    try {
      const filePath = path.join(process.cwd(), "public", galleryImage.imageUrl);
      await unlink(filePath);
    } catch {
      // File might not exist on disk, continue with DB deletion
    }

    // Delete from database
    await db.galleryImage.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch {
    return serverErrorResponse();
  }
}
