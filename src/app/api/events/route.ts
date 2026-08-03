import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse, forbiddenResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

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
  } catch (error) {
    console.error("GET events error:", error);
    return successResponse({ events: [] });
  }
}

const normalizePaymentConfig = (raw: unknown, fallbackFee: number) => {
  if (!raw) return null;

  let payload: any = raw;
  if (typeof raw === "string") {
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new Error("Invalid paymentConfig JSON payload");
    }
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("paymentConfig must be an object");
  }

  const feeAmount = Number(payload.feeAmount ?? fallbackFee ?? 0);
  const paymentRequired = Boolean(payload.paymentRequired ?? feeAmount > 0);

  return {
    paymentRequired,
    feeAmount: Number.isFinite(feeAmount) ? feeAmount : 0,
    bkashNumber: typeof payload.bkashNumber === "string" ? payload.bkashNumber.trim() : "",
    nagadNumber: typeof payload.nagadNumber === "string" ? payload.nagadNumber.trim() : "",
    rocketNumber: typeof payload.rocketNumber === "string" ? payload.rocketNumber.trim() : "",
    bankAccount: typeof payload.bankAccount === "string" ? payload.bankAccount.trim() : "",
    paymentInstructions: typeof payload.paymentInstructions === "string" ? payload.paymentInstructions.trim() : "",
    contactPersonName: typeof payload.contactPersonName === "string" ? payload.contactPersonName.trim() : "",
    contactPersonPhone: typeof payload.contactPersonPhone === "string" ? payload.contactPersonPhone.trim() : "",
    paymentDeadline: typeof payload.paymentDeadline === "string" ? payload.paymentDeadline : "",
  };
};

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
      paymentConfig,
    } = body;

    if (!title || !description || !startDate || !endDate || !venue) {
      return errorResponse("title, description, startDate, endDate, and venue are required");
    }

    const EVENT_CREATOR_ROLES = ["PRESIDENT", "VP", "GS", "PLATFORM_ADMIN", "MEDIA"];
    const caller = await getSupabaseUser(EVENT_CREATOR_ROLES);
    if (!caller) {
      return forbiddenResponse("Only President, VP, GS, Media, or Platform Admin can create events");
    }
    const createdBy = caller.userId;

    let normalizedPaymentConfig: string | null = null;
    try {
      if (paymentConfig !== undefined) {
        normalizedPaymentConfig = JSON.stringify(normalizePaymentConfig(paymentConfig, Number(fee) || 0));
      }
    } catch (configError) {
      return errorResponse((configError as Error).message, 400);
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
        paymentConfig: normalizedPaymentConfig,
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
  } catch (error) {
    console.error("POST events error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Database connection is not configured")) {
      return errorResponse("Database connection is not configured", 503);
    }

    if (message.includes("Unique constraint") || message.includes("Foreign key")) {
      return errorResponse(message, 400);
    }

    return serverErrorResponse();
  }
}
