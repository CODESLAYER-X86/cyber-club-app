import prisma from "@/lib/db";
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("Unauthorized");
    }

    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return errorResponse("userId query parameter is required");
    }

    if (caller.userId !== userId && !["PLATFORM_ADMIN", "PRESIDENT"].includes(caller.role)) {
      return forbiddenResponse("You do not have permission to view these notifications");
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return successResponse({ notifications, unreadCount });
  } catch {
    return serverErrorResponse();
  }
}
