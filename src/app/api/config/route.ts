import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const feeConfig = await prisma.systemConfig.findUnique({
      where: { key: "membership_fee" },
    });
    const membershipFee = feeConfig ? parseFloat(feeConfig.value) : 100;
    return successResponse({ membershipFee });
  } catch (error) {
    console.error("GET config error:", error);
    return serverErrorResponse();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return errorResponse("Unauthorized", 401);
    }
    const userId = caller.userId;

    // Check if the user is PRESIDENT
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || (user.role !== "PRESIDENT" && user.role !== "PLATFORM_ADMIN")) {
      return errorResponse("Forbidden: Only the President and Platform Admin can update club configurations", 403);
    }

    const body = await req.json();
    const { membershipFee } = body;

    if (membershipFee === undefined) {
      return errorResponse("membershipFee is required", 400);
    }

    const fee = parseFloat(membershipFee);
    if (isNaN(fee) || fee < 100 || fee > 1000) {
      return errorResponse("Membership fee must be a number between 100 and 1000", 400);
    }

    // Get old value for detailed audit logging
    const oldConfig = await prisma.systemConfig.findUnique({
      where: { key: "membership_fee" },
    });
    const oldFee = oldConfig ? parseFloat(oldConfig.value) : 100;

    // Save configuration
    await prisma.systemConfig.upsert({
      where: { key: "membership_fee" },
      update: { value: fee.toString() },
      create: { key: "membership_fee", value: fee.toString() },
    });

    // Detailed audit logging
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CONFIG_UPDATE",
        details: `${user.role === 'PLATFORM_ADMIN' ? 'Platform Admin' : 'President'} updated membership fee from ৳${oldFee} to ৳${fee}`,
      },
    });

    return successResponse({ membershipFee: fee });
  } catch (error) {
    console.error("PATCH config error:", error);
    return serverErrorResponse();
  }
}
