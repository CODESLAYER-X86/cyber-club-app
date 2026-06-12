import prisma from "@/lib/db";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/api-utils";
import { NextRequest } from "next/server";

const REJECT_ROLES = ["PRESIDENT", "VP"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return errorResponse("userId is required");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true },
    });

    if (!user || !REJECT_ROLES.includes(user.role)) {
      return forbiddenResponse(
        "Only PRESIDENT or VP can reject achievements"
      );
    }

    const achievement = await prisma.achievement.findUnique({
      where: { id },
    });

    if (!achievement) {
      return notFoundResponse("Achievement not found");
    }

    if (achievement.status !== "PENDING") {
      return errorResponse("Only pending achievements can be rejected");
    }

    const updated = await prisma.achievement.update({
      where: { id },
      data: {
        status: "REJECTED",
      },
      include: {
        submitter: {
          select: { id: true, name: true, avatar: true },
        },
        approver: {
          select: { id: true, name: true },
        },
      },
    });

    // Notify the creator
    await prisma.notification.create({
      data: {
        userId: achievement.submittedBy,
        title: "Achievement Rejected",
        message: `"${achievement.title}" has been rejected.`,
        type: "WARNING",
      },
    });

    return successResponse({ achievement: updated });
  } catch {
    return serverErrorResponse();
  }
}
