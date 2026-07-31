import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { getSupabaseUser } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

const APPROVAL_ROLES = ["PRESIDENT", "GS", "PLATFORM_ADMIN"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { approverRole, status } = body;

    const caller = await getSupabaseUser(APPROVAL_ROLES);
    if (!caller) {
      return forbiddenResponse("Only the President, General Secretary, or Platform Admin can approve or reject deposits");
    }

    const deposit = await prisma.treasuryDeposit.findUnique({
      where: { id },
    });

    if (!deposit) {
      return notFoundResponse("Deposit not found");
    }

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return errorResponse("status must be APPROVED or REJECTED", 400);
    }

    const role = caller.role;
    const isPresident = role === "PRESIDENT" || role === "PLATFORM_ADMIN";
    const isGs = role === "GS" || role === "PLATFORM_ADMIN";

    if ((approverRole === "PRESIDENT" && !isPresident) || (approverRole === "GS" && !isGs)) {
      return forbiddenResponse("You are not authorized to act as that approver role");
    }

    const nextPresidentStatus = approverRole === "PRESIDENT" ? status : deposit.presidentStatus;
    const nextGsStatus = approverRole === "GS" ? status : deposit.gsStatus;

    const updateData: Record<string, unknown> = {
      presidentStatus: nextPresidentStatus,
      gsStatus: nextGsStatus,
      status:
        nextPresidentStatus === "APPROVED" && nextGsStatus === "APPROVED"
          ? "APPROVED"
          : nextPresidentStatus === "REJECTED" || nextGsStatus === "REJECTED"
            ? "REJECTED"
            : "PENDING",
    };

    if (approverRole === "PRESIDENT") {
      updateData.presidentApprovedBy = caller.userId;
    }

    if (approverRole === "GS") {
      updateData.gsApprovedBy = caller.userId;
    }

    const updatedDeposit = await prisma.treasuryDeposit.update({
      where: { id },
      data: updateData,
      include: {
        submitter: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (updatedDeposit.status === "APPROVED") {
      await prisma.ledgerEntry.create({
        data: {
          type: "CREDIT",
          amount: updatedDeposit.amount,
          wallet: "CLUB_BANK_ACCOUNT",
          description: `Treasury deposit approved: ${updatedDeposit.source}`,
          referenceId: updatedDeposit.id,
          performedBy: caller.userId,
        },
      });
    }

    return successResponse({ deposit: updatedDeposit });
  } catch (error) {
    console.error("[Treasury Deposit Approve]", error);
    return serverErrorResponse();
  }
}
