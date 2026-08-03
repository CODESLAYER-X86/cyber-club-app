import prisma from "@/lib/db";
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";
import { isPlatformAdminEmail } from "@/lib/auth";

const ADMIN_ROLES = ["PRESIDENT", "PLATFORM_ADMIN"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return errorResponse("role is required");
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

    // Authenticate the updater from server session
    const updater = await getSupabaseUser(ADMIN_ROLES);
    if (!updater) {
      return forbiddenResponse("Only PRESIDENT and PLATFORM_ADMIN can update roles");
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return notFoundResponse("User not found");
    }

    // 1. No one can assign platform admin role
    if (role === "PLATFORM_ADMIN") {
      return forbiddenResponse("Platform Admin role cannot be manually assigned");
    }

    // 2. No one can modify a platform admin
    if (targetUser.role === "PLATFORM_ADMIN" || isPlatformAdminEmail(targetUser.email)) {
      return forbiddenResponse("Platform Admin role cannot be modified");
    }

    // 3. Only Platform Admin can assign President role
    if (role === "PRESIDENT" && updater.role !== "PLATFORM_ADMIN") {
      return forbiddenResponse("Only Platform Admins can assign the President role");
    }

    // 4. Only Platform Admin can modify a user who is currently a President
    if (targetUser.role === "PRESIDENT" && updater.role !== "PLATFORM_ADMIN") {
      return forbiddenResponse("Only Platform Admins can modify the President role");
    }

    // Enforce single-person roles: PRESIDENT, VP, GS, TREASURER
    const SINGLE_PERSON_ROLES = ["PRESIDENT", "VP", "GS", "TREASURER"];
    if (SINGLE_PERSON_ROLES.includes(role)) {
      const existingUser = await prisma.user.findFirst({
        where: { role },
      });
      if (existingUser && existingUser.id !== id) {
        // Demote existing user to MEMBER
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: "MEMBER" },
        });

        // Log the auto-demotion
        await prisma.auditLog.create({
          data: {
            userId: updater.userId,
            action: "ROLE_UPDATE",
            details: `Auto-demoted ${existingUser.name} (${existingUser.email}) from ${role} to MEMBER due to new assignment to ${targetUser.name}`,
          },
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });

    // Log to audit log
    await prisma.auditLog.create({
      data: {
        userId: updater.userId,
        action: "ROLE_UPDATE",
        details: `Changed role of ${targetUser.name} (${targetUser.email}) from ${targetUser.role} to ${role}`,
      },
    });

    // Notify the user
    await prisma.notification.create({
      data: {
        userId: id,
        title: "Role Updated",
        message: `Your role has been updated to ${role}.`,
        type: "INFO",
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return successResponse({ user: userWithoutPassword });
  } catch (error) {
    console.error("Role update error:", error);
    return serverErrorResponse();
  }
}
