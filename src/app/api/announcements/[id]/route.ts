import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ANNOUNCEMENT_ROLES = ["PRESIDENT", "VP", "GS", "PLATFORM_ADMIN", "MEDIA"];
    const caller = await getSupabaseUser(ANNOUNCEMENT_ROLES);
    if (!caller) {
      return forbiddenResponse("Only President, VP, GS, Media, or Platform Admin can delete announcements");
    }

    // Check if the announcement exists
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return notFoundResponse("Announcement not found");
    }

    // Delete the announcement
    await prisma.announcement.delete({
      where: { id },
    });

    return successResponse({ message: "Announcement deleted successfully" });
  } catch {
    return serverErrorResponse();
  }
}
