import prisma from "@/lib/db";
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("Unauthorized");
    }

    const requestedUserId = request.nextUrl.searchParams.get("userId");
    const isAdmin = caller.role === "PLATFORM_ADMIN";
    const targetUserId = (isAdmin && requestedUserId) ? requestedUserId : caller.userId;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      return notFoundResponse("User not found");
    }

    const { password: _, ...userWithoutPassword } = user;
    return successResponse({ user: userWithoutPassword });
  } catch {
    return serverErrorResponse();
  }
}

