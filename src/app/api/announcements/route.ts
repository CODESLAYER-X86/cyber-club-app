import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse, forbiddenResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ announcements });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, type = "GENERAL" } = body;

    if (!title || !content) {
      return errorResponse("title and content are required");
    }

    const ANNOUNCEMENT_ROLES = ["PRESIDENT", "VP", "GS", "PLATFORM_ADMIN", "MEDIA"];
    const caller = await getSupabaseUser(ANNOUNCEMENT_ROLES);
    if (!caller) {
      return forbiddenResponse("Only President, VP, GS, Media, or Platform Admin can publish announcements");
    }
    const createdBy = caller.userId;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        createdBy,
      },
    });

    // Notify all active members
    const activeMembers = await prisma.user.findMany({
      where: { membershipStatus: "ACTIVE" },
      select: { id: true },
    });

    if (activeMembers.length > 0) {
      await prisma.notification.createMany({
        data: activeMembers.map((member) => ({
          userId: member.id,
          title: `Announcement: ${title}`,
          message: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
          type: type === "URGENT" ? "WARNING" : "INFO",
        })),
      });
    }

    return successResponse({ announcement }, 201);
  } catch {
    return serverErrorResponse();
  }
}
