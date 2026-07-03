import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

const APPROVE_ROLES = ["PRESIDENT", "VP", "PLATFORM_ADMIN"];
const DELETE_ROLES = ["PRESIDENT", "PLATFORM_ADMIN"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const caller = await getSupabaseUser(APPROVE_ROLES);
    if (!caller) {
      return forbiddenResponse("Only PRESIDENT, VP, or PLATFORM_ADMIN can update achievement status");
    }
    const approvedBy = caller.userId;

    const achievement = await prisma.achievement.findUnique({
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

    const updatedAchievement = await prisma.achievement.update({
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

    const caller = await getSupabaseUser(DELETE_ROLES);
    if (!caller) {
      return forbiddenResponse("Only PRESIDENT or PLATFORM_ADMIN can delete achievements");
    }

    const achievement = await prisma.achievement.findUnique({
      where: { id },
    });

    if (!achievement) {
      return notFoundResponse("Achievement not found");
    }

    await prisma.achievement.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch {
    return serverErrorResponse();
  }
}
