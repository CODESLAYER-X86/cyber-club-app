import { db } from "@/lib/db";
import { successResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        membershipStatus: true,
        avatar: true,
        studentId: true,
        department: true,
        phone: true,
        bio: true,
        transactionId: true,
        paymentProof: true,
        createdAt: true,
        updatedAt: true,
        eventRegistrations: {
          include: { event: true },
          orderBy: { registeredAt: "desc" },
        },
        certificates: {
          include: { event: true },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return notFoundResponse("User not found");
    }

    return successResponse({ user });
  } catch {
    return serverErrorResponse();
  }
}
