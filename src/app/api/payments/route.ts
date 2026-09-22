import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse, forbiddenResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";
import { isSafeUrl } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("Please sign in to view payment records");
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const requestedUserId = searchParams.get("userId");

    const isFinancialAdmin = ["TREASURER", "PRESIDENT", "GS", "PLATFORM_ADMIN"].includes(caller.role);
    const isEventVerifier = caller.role === "VERIFIER";

    if (requestedUserId && requestedUserId !== caller.userId && !isFinancialAdmin && !isEventVerifier) {
      return forbiddenResponse("You do not have permission to view other users' payment records");
    }

    const where: Record<string, unknown> = {};

    if (isFinancialAdmin) {
      // Financial leadership has full access across all types and users
      if (requestedUserId) {
        where.userId = requestedUserId;
      }
      if (type) {
        where.type = type;
      }
    } else if (isEventVerifier) {
      // Event Verifiers can ONLY inspect event-related payments
      where.type = "EVENT";
      if (requestedUserId) {
        where.userId = requestedUserId;
      }
    } else {
      // General members and guests can ONLY query their own payments
      where.userId = caller.userId;
      if (type) {
        where.type = type;
      }
    }

    if (status) {
      if (status.includes(",")) {
        where.status = { in: status.split(",") };
      } else {
        where.status = status;
      }
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
            // email is omitted to prevent staff PII leakage to clients / interceptors
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const paymentsWithReconciled = payments.map(p => ({
      ...p,
      reconciled: false,
    }));

    return successResponse({ payments: paymentsWithReconciled });
  } catch (e) {
    console.error("[Payments GET API] Error:", e);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, type = "MEMBERSHIP", transactionId, paymentMethod = "BKASH", proofUrl, eventId } = body;

    if (!userId || !amount || !transactionId) {
      return errorResponse("userId, amount, and transactionId are required");
    }

    const VALID_METHODS = ["BKASH", "NAGAD", "BANK", "CASH"];
    if (!VALID_METHODS.includes(paymentMethod)) {
      return errorResponse(`Invalid paymentMethod. Must be one of: ${VALID_METHODS.join(", ")}`);
    }

    if (proofUrl && !isSafeUrl(proofUrl)) {
      return errorResponse("Invalid payment proof URL. Must be a safe HTTP/HTTPS URL.", 400);
    }

    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("You must be logged in to submit payments");
    }

    // Anti-spoofing: normal members can only submit payments on behalf of themselves
    if (userId !== caller.userId && !["TREASURER", "PRESIDENT", "PLATFORM_ADMIN"].includes(caller.role)) {
      return forbiddenResponse("You can only submit payments for yourself");
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        type,
        transactionId,
        paymentMethod,
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
