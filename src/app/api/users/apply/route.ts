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
    const {
      studentId,
      rollNumber,
      batch,
      department,
      phone,
      transactionId,
      paymentMethod = "BKASH",
      gender,
      sentToNumber,
      receiverName: requestedReceiverName,
    } = body;

    const VALID_METHODS = ["BKASH", "NAGAD", "ROCKET", "BANK", "CASH", "PREVIOUS_MEMBER"];
    const validatedMethod = VALID_METHODS.includes(paymentMethod) ? paymentMethod : "BKASH";
    const isPreviousMember = validatedMethod === "PREVIOUS_MEMBER";

    const normalizedGender = gender === "FEMALE" ? "FEMALE" : gender === "MALE" ? "MALE" : null;

    const effectiveTrxId = isPreviousMember
      ? (transactionId?.trim() || "Previous Member")
      : transactionId?.trim();

    const effectiveSentToNumber = isPreviousMember
      ? "None (Previous Member)"
      : validatedMethod === "CASH"
        ? (sentToNumber?.trim() || "Physical Cash Desk / University Booth")
        : (sentToNumber?.trim() || "Club Official Account");

    const effectiveReceiverName = isPreviousMember
      ? "Previous Member Archive"
      : validatedMethod === "CASH"
        ? (requestedReceiverName?.trim() || "Campus Cash Booth")
        : (requestedReceiverName?.trim() || "Treasurer / Club MFS");

    if (!studentId || !rollNumber || !batch || !department || !phone || !effectiveTrxId) {
      return errorResponse("All academic and verification fields are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return errorResponse("User not found", 404);
    }

    if (user.membershipStatus !== "NON_MEMBER" && user.membershipStatus !== "REJECTED") {
      return errorResponse("User has already applied or is already an active member", 400);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        studentId: studentId.trim(),
        rollNumber: rollNumber.trim(),
        batch: batch.trim(),
        department: department.trim(),
        phone: phone.trim(),
        transactionId: effectiveTrxId,
        paymentMethod: validatedMethod,
        gender: normalizedGender,
        sentToNumber: effectiveSentToNumber,
        membershipStatus: "PENDING",
      },
    });

    // Fetch membership fee from system configuration
    const feeConfig = await prisma.systemConfig.findUnique({
      where: { key: "membership_fee" },
    });
    const standardFee = feeConfig ? parseFloat(feeConfig.value) : 100;
    const paymentAmount = isPreviousMember ? 0 : standardFee;

    // Create a payment record for the membership fee
    await prisma.payment.create({
      data: {
        userId,
        amount: paymentAmount,
        type: "MEMBERSHIP",
        status: "PENDING",
        transactionId: effectiveTrxId,
        paymentMethod: validatedMethod,
        sentToNumber: effectiveSentToNumber,
        receiverName: effectiveReceiverName,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "MEMBERSHIP_APPLICATION",
        details: isPreviousMember
          ? `User submitted previous membership claim (Ref/Trx: ${effectiveTrxId}, Method: PREVIOUS_MEMBER)`
          : user.membershipStatus === "REJECTED"
            ? `User re-submitted membership application after prior rejection (Trx ID: ${effectiveTrxId}, Method: ${validatedMethod})`
            : `User submitted membership application (Trx ID: ${effectiveTrxId}, Method: ${validatedMethod})`,
      },
    });

    return successResponse({ user: updatedUser });
  } catch (error) {
    console.error("Apply membership error:", error);
    return serverErrorResponse();
  }
}
