import prisma from "@/lib/db";
import {
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
  successResponse,
} from "@/lib/api-utils";
import { getSupabaseUser } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

const ALLOWED_ROLES = ["MEDIA", "PRESIDENT", "PLATFORM_ADMIN"];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id, photoId } = await params;
    const caller = await getSupabaseUser(ALLOWED_ROLES);
    if (!caller) {
      return errorResponse("Only MEDIA, PRESIDENT, or PLATFORM_ADMIN can delete photos", 403);
    }

    const photo = await prisma.galleryImage.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.eventId !== id) {
      return notFoundResponse("Photo not found in this event");
    }

    await prisma.galleryImage.delete({ where: { id: photoId } });

    return successResponse({ message: "Photo deleted successfully" });
  } catch {
    return serverErrorResponse();
  }
}
