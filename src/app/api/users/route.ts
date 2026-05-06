import { db } from "@/lib/db";
import { successResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");
    const membershipStatus = searchParams.get("membershipStatus");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (role) {
      where.role = role;
    }

    if (membershipStatus) {
      where.membershipStatus = membershipStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { studentId: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const users = await db.user.findMany({
      where,
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
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ users });
  } catch {
    return serverErrorResponse();
  }
}
