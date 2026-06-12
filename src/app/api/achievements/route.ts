import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const achievements = await prisma.achievement.findMany({
      where,
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
      orderBy: { achievedDate: "desc" },
    });

    return successResponse({ achievements });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, submittedBy, achievedDate, imageUrl, category, achievedBy } = body;

    if (!title || !description || !submittedBy || !achievedDate) {
      return errorResponse("title, description, submittedBy, and achievedDate are required");
    }

    const achievement = await prisma.achievement.create({
      data: {
        title,
        description,
        submittedBy,
        achievedDate: new Date(achievedDate),
        imageUrl,
        category: category || "COMPETITION",
        achievedBy,
        status: "PENDING",
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

    return successResponse({ achievement }, 201);
  } catch {
    return serverErrorResponse();
  }
}
