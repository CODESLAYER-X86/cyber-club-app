import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse, forbiddenResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Fetch author names to display in UI without leaking internal user IDs
    const userIds = [...new Set(announcements.map((a) => a.createdBy).filter(Boolean))];
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, role: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const caller = await getSupabaseUser();
    const canManage = !!(caller && ["PRESIDENT", "VP", "GS", "PLATFORM_ADMIN", "MEDIA"].includes(caller.role));

    const sanitizedAnnouncements = announcements.map((a) => {
      const { id, ...publicFields } = {
        id: a.id,
        title: a.title,
        content: a.content,
        type: a.type,
        authorName: userMap.get(a.createdBy) || "Executive Committee",
        createdAt: a.createdAt,
      };
      return canManage ? { id, ...publicFields } : publicFields;
    });

    return successResponse({ announcements: sanitizedAnnouncements });
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
