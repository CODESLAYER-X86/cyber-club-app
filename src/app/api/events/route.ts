import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { venue: { contains: search } },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return successResponse({ events });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      type = "PUBLIC",
      category = "WORKSHOP",
      startDate,
      endDate,
      venue,
      fee = 0,
      maxSeats,
      poster,
      status = "UPCOMING",
      requiresAssessment = false,
      passingScore,
      verifierId,
      createdBy,
    } = body;

    if (!title || !description || !startDate || !endDate || !venue || !createdBy) {
      return errorResponse("title, description, startDate, endDate, venue, and createdBy are required");
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type,
        category,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        venue,
        fee,
        maxSeats,
        poster,
        status,
        requiresAssessment,
        passingScore,
        verifierId,
        createdBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return successResponse({ event }, 201);
  } catch {
    return serverErrorResponse();
  }
}
