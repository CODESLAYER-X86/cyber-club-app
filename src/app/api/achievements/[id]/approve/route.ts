import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

const APPROVE_ROLES = ["PRESIDENT", "VP", "PLATFORM_ADMIN"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caller = await getSupabaseUser(APPROVE_ROLES);
    if (!caller) {
      return forbiddenResponse("Only PRESIDENT, VP, or PLATFORM_ADMIN can approve achievements");
    }
    const approvedBy = caller.userId;

    const achievement = await prisma.achievement.findUnique({
      where: { id },
    });

    if (!achievement) {
      return notFoundResponse("Achievement not found");
    }

    if (achievement.status === "APPROVED") {
      return errorResponse("Achievement is already approved");
    }

    const updatedAchievement = await prisma.achievement.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy,
      },
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

    // Notify the submitter
    await prisma.notification.create({
      data: {
        userId: achievement.submittedBy,
        title: "Achievement Approved",
        message: `Your achievement "${achievement.title}" has been approved.`,
        type: "SUCCESS",
      },
    });

    return successResponse({ achievement: updatedAchievement });
  } catch {
    return serverErrorResponse();
  }
}
