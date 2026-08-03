import prisma from "@/lib/db";
import { successResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("Unauthorized");
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return notFoundResponse("Notification not found");
    }

    if (notification.userId !== caller.userId && caller.role !== "PLATFORM_ADMIN") {
      return forbiddenResponse("You do not have permission to read this notification");
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return successResponse({ notification: updatedNotification });
  } catch {
    return serverErrorResponse();
  }
}
