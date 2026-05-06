import { db } from "@/lib/db";
import {
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/api-utils";
import { NextRequest } from "next/server";

const ALLOWED_ROLES = ["MEDIA", "PRESIDENT", "PLATFORM_ADMIN"];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id, photoId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return errorResponse("userId is required for authorization");
    }

    // RBAC check
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || !ALLOWED_ROLES.includes(user.role)) {
      return errorResponse("Only MEDIA, PRESIDENT, or PLATFORM_ADMIN can delete photos", 403);
    }

    const photo = await db.galleryPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.albumId !== id) {
      return notFoundResponse("Photo not found in this album");
    }

    await db.galleryPhoto.delete({ where: { id: photoId } });

    return successResponse({ message: "Photo deleted successfully" });
  } catch {
    return serverErrorResponse();
  }
}
