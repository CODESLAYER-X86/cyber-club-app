import { db } from "@/lib/db";
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

const ADMIN_ROLES = ["PRESIDENT", "PLATFORM_ADMIN"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, updatedBy } = body;

    if (!role || !updatedBy) {
      return errorResponse("role and updatedBy are required");
    }

    const validRoles = [
      "PLATFORM_ADMIN",
      "PRESIDENT",
      "VP",
      "GS",
      "TREASURER",
      "MEDIA",
      "VERIFIER",
      "MEMBER",
      "GUEST",
    ];

    if (!validRoles.includes(role)) {
      return errorResponse(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }

    // Check if the updater has permission
    const updater = await db.user.findUnique({ where: { id: updatedBy } });
    if (!updater) {
      return errorResponse("Updater not found", 404);
    }

    if (!ADMIN_ROLES.includes(updater.role)) {
      return forbiddenResponse("Only PRESIDENT and PLATFORM_ADMIN can update roles");
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return notFoundResponse("User not found");
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: { role },
    });

    // Log to audit log
    await db.auditLog.create({
      data: {
        userId: updatedBy,
        action: "ROLE_UPDATE",
        details: `Changed role of ${targetUser.name} (${targetUser.email}) from ${targetUser.role} to ${role}`,
      },
    });

    // Notify the user
    await db.notification.create({
      data: {
        userId: id,
        title: "Role Updated",
        message: `Your role has been updated to ${role}.`,
        type: "INFO",
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return successResponse({ user: userWithoutPassword });
  } catch {
    return serverErrorResponse();
  }
}
