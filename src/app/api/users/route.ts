import { successResponse, errorResponse, serverErrorResponse, forbiddenResponse } from "@/lib/api-utils";
import { requireSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { NextRequest } from "next/server";

// GET /api/users — protected, only admins/officers
export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireSession([
      "PLATFORM_ADMIN", "PRESIDENT", "VP", "GS", "TREASURER",
    ]);
    if (error) return forbiddenResponse(error === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden");

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");
    const membershipStatus = searchParams.get("membershipStatus");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (membershipStatus) where.membershipStatus = membershipStatus;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
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
        createdAt: true,
        updatedAt: true,
        // NEVER expose: password, transactionId, paymentProof
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ users });
  } catch {
    return serverErrorResponse();
  }
}
