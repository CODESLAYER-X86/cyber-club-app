import { db } from "@/lib/db";
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

const CREATE_ROLES = ["PRESIDENT", "GS", "PLATFORM_ADMIN"];

export async function GET() {
  try {
    const members = await db.committeeMember.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    return successResponse({ members });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      role,
      description,
      imageUrl,
      department,
      email,
      socialLinks,
      order,
      requesterRole,
    } = body;

    if (!name || !role || !description) {
      return errorResponse("name, role, and description are required");
    }

    if (!requesterRole || !CREATE_ROLES.includes(requesterRole)) {
      return forbiddenResponse("Only PRESIDENT, GS, or PLATFORM_ADMIN can create committee members");
    }

    const member = await db.committeeMember.create({
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
