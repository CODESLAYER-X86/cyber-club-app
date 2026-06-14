import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const [feeConfig, primaryConfig, secondaryConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: "membership_fee" } }),
      prisma.systemConfig.findUnique({ where: { key: "default_cert_primary_color" } }),
      prisma.systemConfig.findUnique({ where: { key: "default_cert_secondary_color" } }),
    ]);

    const membershipFee = feeConfig ? parseFloat(feeConfig.value) : 100;
    const defaultPrimaryColor = primaryConfig ? primaryConfig.value : "#10b981";
    const defaultSecondaryColor = secondaryConfig ? secondaryConfig.value : "#06b6d4";

    return successResponse({ membershipFee, defaultPrimaryColor, defaultSecondaryColor });
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
    const { membershipFee, defaultPrimaryColor, defaultSecondaryColor } = body;

    const auditDetails: string[] = [];
    const updates: Promise<any>[] = [];

    if (membershipFee !== undefined) {
      const fee = parseFloat(membershipFee);
      if (isNaN(fee) || fee < 100 || fee > 1000) {
        return errorResponse("Membership fee must be a number between 100 and 1000", 400);
      }
      const oldConfig = await prisma.systemConfig.findUnique({
        where: { key: "membership_fee" },
      });
      const oldFee = oldConfig ? parseFloat(oldConfig.value) : 100;
      updates.push(
        prisma.systemConfig.upsert({
          where: { key: "membership_fee" },
          update: { value: fee.toString() },
          create: { key: "membership_fee", value: fee.toString() },
        })
      );
      auditDetails.push(`membership fee from ৳${oldFee} to ৳${fee}`);
    }

    if (defaultPrimaryColor !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(defaultPrimaryColor)) {
        return errorResponse("Invalid primary color format. Must be a hex code (e.g. #10b981)", 400);
      }
      updates.push(
        prisma.systemConfig.upsert({
          where: { key: "default_cert_primary_color" },
          update: { value: defaultPrimaryColor },
          create: { key: "default_cert_primary_color", value: defaultPrimaryColor },
        })
      );
      auditDetails.push(`default certificate primary color to ${defaultPrimaryColor}`);
    }

    if (defaultSecondaryColor !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(defaultSecondaryColor)) {
        return errorResponse("Invalid secondary color format. Must be a hex code (e.g. #06b6d4)", 400);
      }
      updates.push(
        prisma.systemConfig.upsert({
          where: { key: "default_cert_secondary_color" },
          update: { value: defaultSecondaryColor },
          create: { key: "default_cert_secondary_color", value: defaultSecondaryColor },
        })
      );
      auditDetails.push(`default certificate secondary color to ${defaultSecondaryColor}`);
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      // Detailed audit logging
      await prisma.auditLog.create({
        data: {
          userId,
          action: "CONFIG_UPDATE",
          details: `${user.role === 'PLATFORM_ADMIN' ? 'Platform Admin' : 'President'} updated: ${auditDetails.join(", ")}`,
        },
      });
    }

    // Return the updated config
    const [feeConfig, primaryConfig, secondaryConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: "membership_fee" } }),
      prisma.systemConfig.findUnique({ where: { key: "default_cert_primary_color" } }),
      prisma.systemConfig.findUnique({ where: { key: "default_cert_secondary_color" } }),
    ]);

    return successResponse({
      membershipFee: feeConfig ? parseFloat(feeConfig.value) : 100,
      defaultPrimaryColor: primaryConfig ? primaryConfig.value : "#10b981",
      defaultSecondaryColor: secondaryConfig ? secondaryConfig.value : "#06b6d4",
    });
  } catch (error) {
    console.error("PATCH config error:", error);
    return serverErrorResponse();
  }
}
