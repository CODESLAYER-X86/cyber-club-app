import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return errorResponse("Unauthorized", 401);
    }
    const userId = caller.userId;
    
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

    // Fetch membership fee from system configuration
    const feeConfig = await prisma.systemConfig.findUnique({
      where: { key: "membership_fee" },
    });
    const membershipFee = feeConfig ? parseFloat(feeConfig.value) : 100;

    // Create a payment record for the membership fee
    await prisma.payment.create({
      data: {
        userId,
        amount: membershipFee,
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
