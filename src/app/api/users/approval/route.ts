import { db } from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

// GET pending member approval requests
export async function GET() {
  try {
    const pendingUsers = await db.user.findMany({
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
    const body = await request.json();
    const { userId, action, approverId } = body;

    if (!userId || !action || !approverId) {
      return errorResponse("userId, action, and approverId are required");
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return errorResponse("Action must be APPROVE or REJECT");
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return errorResponse("User not found", 404);
    }

    if (user.membershipStatus !== "PENDING") {
      return errorResponse("User is not in PENDING status");
    }

    const newStatus = action === "APPROVE" ? "ACTIVE" : "REJECTED";

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { membershipStatus: newStatus },
    });

    // Create notification for the user
    await db.notification.create({
      data: {
        userId,
        title: action === "APPROVE" ? "Membership Approved" : "Membership Rejected",
        message:
          action === "APPROVE"
            ? "Your membership has been approved! Welcome to the Cyber Security Club."
            : "Your membership application has been rejected. Please contact an administrator for more information.",
        type: action === "APPROVE" ? "SUCCESS" : "WARNING",
      },
    });

    // Log to audit log
    await db.auditLog.create({
      data: {
        userId: approverId,
        action: `MEMBER_${action}`,
        details: `${action === "APPROVE" ? "Approved" : "Rejected"} membership for user ${user.name} (${user.email})`,
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return successResponse({ user: userWithoutPassword });
  } catch {
    return serverErrorResponse();
  }
}
