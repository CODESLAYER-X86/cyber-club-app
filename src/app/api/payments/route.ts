import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const userId = searchParams.get("userId");

    const where: Record<string, unknown> = {};

    if (status) {
      if (status.includes(",")) {
        where.status = { in: status.split(",") };
      } else {
        where.status = status;
      }
    }

    if (type) {
      where.type = type;
    }

    if (userId) {
      where.userId = userId;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            membershipStatus: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ payments });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, type = "MEMBERSHIP", transactionId, proofUrl, eventId } = body;

    if (!userId || !amount || !transactionId) {
      return errorResponse("userId, amount, and transactionId are required");
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        type,
        transactionId,
        proofUrl,
        eventId,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return successResponse({ payment }, 201);
  } catch {
    return serverErrorResponse();
  }
}
