import { db } from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return errorResponse("userId query parameter is required");
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return successResponse({ notifications, unreadCount });
  } catch {
    return serverErrorResponse();
  }
}
