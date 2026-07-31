import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

const DEFAULT_MEMBERSHIP_PAYMENT_SETTINGS = {
  paymentRequired: true,
  bkashNumber: "",
  nagadNumber: "",
  rocketNumber: "",
  bankAccount: "",
  paymentInstructions: "",
  contactPersonName: "",
  contactPersonPhone: "",
};

const parseMembershipPaymentSettings = (value?: string | null) => {
  if (!value) return { ...DEFAULT_MEMBERSHIP_PAYMENT_SETTINGS };

  try {
    const parsed = JSON.parse(value);
    return {
      ...DEFAULT_MEMBERSHIP_PAYMENT_SETTINGS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_MEMBERSHIP_PAYMENT_SETTINGS };
  }
};

export async function GET(req: NextRequest) {
  try {
    const [feeConfig, primaryConfig, secondaryConfig, paymentSettingsConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: "membership_fee" } }),
      prisma.systemConfig.findUnique({ where: { key: "default_cert_primary_color" } }),
      prisma.systemConfig.findUnique({ where: { key: "default_cert_secondary_color" } }),
      prisma.systemConfig.findUnique({ where: { key: "membership_payment_settings" } }),
    ]);

    const membershipFee = feeConfig ? parseFloat(feeConfig.value) : 100;
    const defaultPrimaryColor = primaryConfig ? primaryConfig.value : "#10b981";
    const defaultSecondaryColor = secondaryConfig ? secondaryConfig.value : "#06b6d4";
    const membershipPaymentSettings = parseMembershipPaymentSettings(paymentSettingsConfig?.value);

    return successResponse({ membershipFee, defaultPrimaryColor, defaultSecondaryColor, membershipPaymentSettings });
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
    const { membershipFee, defaultPrimaryColor, defaultSecondaryColor, membershipPaymentSettings } = body;

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

    if (membershipPaymentSettings !== undefined) {
      if (!membershipPaymentSettings || typeof membershipPaymentSettings !== "object") {
        return errorResponse("membershipPaymentSettings must be an object", 400);
      }

      const sanitizedSettings = {
        ...DEFAULT_MEMBERSHIP_PAYMENT_SETTINGS,
        ...membershipPaymentSettings,
      };

      const previousSettings = await prisma.systemConfig.findUnique({ where: { key: "membership_payment_settings" } });
      const previousSettingsValue = previousSettings?.value ?? JSON.stringify(DEFAULT_MEMBERSHIP_PAYMENT_SETTINGS);

      updates.push(
        prisma.systemConfig.upsert({
          where: { key: "membership_payment_settings" },
          update: { value: JSON.stringify(sanitizedSettings) },
          create: { key: "membership_payment_settings", value: JSON.stringify(sanitizedSettings) },
        })
      );

      if (previousSettingsValue !== JSON.stringify(sanitizedSettings)) {
        auditDetails.push(`membership payment settings updated`);
      }
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
    const [feeConfig, primaryConfig, secondaryConfig, paymentSettingsConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: "membership_fee" } }),
      prisma.systemConfig.findUnique({ where: { key: "default_cert_primary_color" } }),
      prisma.systemConfig.findUnique({ where: { key: "default_cert_secondary_color" } }),
      prisma.systemConfig.findUnique({ where: { key: "membership_payment_settings" } }),
    ]);

    return successResponse({
      membershipFee: feeConfig ? parseFloat(feeConfig.value) : 100,
      defaultPrimaryColor: primaryConfig ? primaryConfig.value : "#10b981",
      defaultSecondaryColor: secondaryConfig ? secondaryConfig.value : "#06b6d4",
      membershipPaymentSettings: parseMembershipPaymentSettings(paymentSettingsConfig?.value),
    });
  } catch (error) {
    console.error("PATCH config error:", error);
    return serverErrorResponse();
  }
}
