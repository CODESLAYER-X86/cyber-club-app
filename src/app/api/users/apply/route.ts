import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("csc_token")?.value;
    
    if (!tokenCookie) {
      return errorResponse("Unauthorized", 401);
    }

    let payload;
    try {
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
      const verified = await jwtVerify(tokenCookie, secret);
      payload = verified.payload;
    } catch {
      return errorResponse("Invalid token", 401);
    }

    if (!payload.id) {
      return errorResponse("Unauthorized", 401);
    }

    const userId = payload.id as string;
    
    const body = await req.json();
    const { studentId, department, phone, transactionId } = body;

    if (!studentId || !department || !phone || !transactionId) {
      return errorResponse("All fields are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return errorResponse("User not found", 404);
    }

    if (user.membershipStatus !== "NON_MEMBER") {
      return errorResponse("User has already applied or is already a member", 400);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        studentId,
        department,
        phone,
        transactionId,
        membershipStatus: "PENDING",
      },
    });

    // Create a payment record for the membership fee
    await prisma.payment.create({
      data: {
        userId,
        amount: 500, // Or whatever the dynamic fee is later
        type: "MEMBERSHIP",
        status: "PENDING",
        transactionId,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "MEMBERSHIP_APPLICATION",
        details: `User submitted membership application`,
      },
    });

    return successResponse({ user: updatedUser });
  } catch (error) {
    console.error("Apply membership error:", error);
    return serverErrorResponse();
  }
}
