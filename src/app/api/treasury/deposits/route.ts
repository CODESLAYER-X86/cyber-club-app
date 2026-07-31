import prisma from "@/lib/db";
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { getSupabaseUser } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

const VALID_SOURCES = [
  "UNIVERSITY_FUND",
  "SPONSOR",
  "EVENT_REGISTRATION",
  "MEMBERSHIP_REGISTRATION",
  "DONATION",
  "OTHER",
];

const CREATE_ROLES = ["TREASURER", "PLATFORM_ADMIN"];

export async function GET(request: NextRequest) {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("You must be logged in to view treasury deposits");
    }

    const deposits = await prisma.treasuryDeposit.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        submitter: {
          select: { id: true, name: true, email: true, role: true },
        },
        presidentApprover: {
          select: { id: true, name: true, email: true, role: true },
        },
        gsApprover: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return successResponse({ deposits });
  } catch (error) {
    console.error("[Treasury Deposit GET]", error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const caller = await getSupabaseUser(CREATE_ROLES);
    if (!caller) {
      return forbiddenResponse("Only the Treasurer or Platform Admin can submit deposits");
    }

    const body = await request.json();
    const { date, amount, source, note, attachmentUrl } = body;

    if (!date || !amount || !source) {
      return errorResponse("Date, amount, and source are required", 400);
    }

    if (!VALID_SOURCES.includes(source)) {
      return errorResponse("Invalid deposit source", 400);
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return errorResponse("Amount must be a positive number", 400);
    }

    const deposit = await prisma.treasuryDeposit.create({
      data: {
        date: new Date(date),
        amount: parsedAmount,
        source,
        note: note ?? null,
        attachmentUrl: attachmentUrl ?? null,
        submittedBy: caller.userId,
        status: "PENDING",
        presidentStatus: "PENDING",
        gsStatus: "PENDING",
      },
      include: {
        submitter: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return successResponse({ deposit }, 201);
  } catch (error) {
    console.error("[Treasury Deposit POST]", error);
    return serverErrorResponse();
  }
}
