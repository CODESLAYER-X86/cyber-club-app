import prisma from "@/lib/db";
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { getSupabaseUser } from "@/lib/supabase-server";
import { isSafeUrl } from "@/lib/utils";
import { NextRequest } from "next/server";

const CREATE_ROLES = ["PRESIDENT", "GS", "MEDIA", "PLATFORM_ADMIN"];

export async function GET() {
  try {
    const caller = await getSupabaseUser();
    const canManage = !!(caller && CREATE_ROLES.includes(caller.role));

    const members = await prisma.committeeMember.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        role: true,
        description: true,
        imageUrl: true,
        department: true,
        socialLinks: true,
        order: true,
        isActive: true,
        email: canManage,
        createdAt: true,
        updatedAt: true,
      },
    });

    const sanitizedMembers = members.map((m) => ({
      ...m,
      email: canManage ? m.email : null,
    }));

    return successResponse({ members: sanitizedMembers });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get role from server session — NEVER from client body
    const caller = await getSupabaseUser(CREATE_ROLES);
    if (!caller) return forbiddenResponse("Only PRESIDENT, GS, or PLATFORM_ADMIN can create committee members");

    const body = await request.json();
    const { name, role, description, imageUrl, department, email, socialLinks, order } = body;

    if (!name || !role || !description) {
      return errorResponse("name, role, and description are required");
    }

    if (imageUrl && !isSafeUrl(imageUrl)) {
      return errorResponse("Invalid or unsafe imageUrl");
    }

    if (socialLinks && typeof socialLinks === "object") {
      for (const [key, val] of Object.entries(socialLinks)) {
        if (typeof val === "string" && val.trim() && !isSafeUrl(val)) {
          return errorResponse(`Invalid or unsafe social link for ${key}`);
        }
      }
    }

    const member = await prisma.committeeMember.create({
      data: {
        name,
        role,
        description,
        imageUrl,
        department,
        email,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
        order: order ?? 0,
      },
    });

    return successResponse({ member }, 201);
  } catch {
    return serverErrorResponse();
  }
}
