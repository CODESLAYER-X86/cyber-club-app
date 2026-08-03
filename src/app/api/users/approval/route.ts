import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

// GET pending member approval requests
export async function GET() {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { membershipStatus: "PENDING" },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        studentId: true,
        department: true,
        phone: true,
        transactionId: true,
        paymentProof: true,
        membershipStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse({ users: pendingUsers });
  } catch {
    return serverErrorResponse();
  }
}

// PATCH approve or reject a member
export async function PATCH(request: NextRequest) {
  try {
    const approver = await getSupabaseUser(["PRESIDENT", "GS", "VERIFIER", "PLATFORM_ADMIN"]);
    if (!approver) {
      return errorResponse("Only the President, General Secretary, Event Verifier, and Platform Admin can approve members", 403);
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return errorResponse("userId and action are required");
    }

    // Accept both APPROVE/APPROVED and REJECT/REJECTED formats
    const normalizedAction = action === "APPROVED" ? "APPROVE" : action === "REJECTED" ? "REJECT" : action;
    if (!["APPROVE", "REJECT"].includes(normalizedAction)) {
      return errorResponse("Action must be APPROVE or REJECT");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return errorResponse("User not found", 404);
    }

    if (user.membershipStatus !== "PENDING") {
      return errorResponse("User is not in PENDING status");
    }

    const newStatus = normalizedAction === "APPROVE" ? "ACTIVE" : "REJECTED";

    // If approving, also update the role from GUEST to MEMBER
    const updateData: Record<string, string> = { membershipStatus: newStatus };
    if (normalizedAction === "APPROVE" && user.role === "GUEST") {
      updateData.role = "MEMBER";
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId,
        title: normalizedAction === "APPROVE" ? "Membership Approved" : "Membership Rejected",
        message:
          normalizedAction === "APPROVE"
            ? "Your membership has been approved! Welcome to the Cyber Security Club."
            : "Your membership application has been rejected. Please contact an administrator for more information.",
        type: normalizedAction === "APPROVE" ? "SUCCESS" : "WARNING",
      },
    });

    // Log to audit log
    await prisma.auditLog.create({
      data: {
        userId: approver.userId,
        action: `MEMBER_${normalizedAction}`,
        details: `${normalizedAction === "APPROVE" ? "Approved" : "Rejected"} membership for user ${user.name} (${user.email})`,
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return successResponse({ user: userWithoutPassword });
  } catch {
    return serverErrorResponse();
  }
}
