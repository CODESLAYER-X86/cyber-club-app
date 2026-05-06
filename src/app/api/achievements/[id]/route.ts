import { db } from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

const APPROVE_ROLES = ["PRESIDENT", "VP", "PLATFORM_ADMIN"];
const DELETE_ROLES = ["PRESIDENT", "PLATFORM_ADMIN"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, approvedBy, role } = body;

    if (!role || !APPROVE_ROLES.includes(role)) {
      return forbiddenResponse("Only PRESIDENT, VP, or PLATFORM_ADMIN can update achievement status");
    }

    const achievement = await db.achievement.findUnique({
      where: { id },
    });

    if (!achievement) {
      return notFoundResponse("Achievement not found");
    }

    if (status && !["APPROVED", "REJECTED"].includes(status)) {
      return errorResponse("Status must be APPROVED or REJECTED");
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (approvedBy) updateData.approvedBy = approvedBy;

    const updatedAchievement = await db.achievement.update({
      where: { id },
      data: updateData,
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return successResponse({ achievement: updatedAchievement });
  } catch {
    return serverErrorResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authorization from query params or body
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");

    if (!role || !DELETE_ROLES.includes(role)) {
      return forbiddenResponse("Only PRESIDENT or PLATFORM_ADMIN can delete achievements");
    }

    const achievement = await db.achievement.findUnique({
      where: { id },
    });

    if (!achievement) {
      return notFoundResponse("Achievement not found");
    }

    await db.achievement.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch {
    return serverErrorResponse();
  }
}
