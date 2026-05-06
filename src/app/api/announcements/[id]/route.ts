import { db } from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if the announcement exists
    const announcement = await db.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return notFoundResponse("Announcement not found");
    }

    // Delete the announcement
    await db.announcement.delete({
      where: { id },
    });

    return successResponse({ message: "Announcement deleted successfully" });
  } catch {
    return serverErrorResponse();
  }
}
