import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { getSupabaseUser } from "@/lib/supabase-server";
import prisma from "@/lib/db";
import { NextRequest } from "next/server";

const ALLOWED_ROLES = ["PLATFORM_ADMIN", "PRESIDENT", "VP", "GS", "TREASURER"];

// GET /api/users — protected, only admins/officers
export async function GET(request: NextRequest) {
  try {
    const caller = await getSupabaseUser(ALLOWED_ROLES);
    if (!caller) return errorResponse("Forbidden", 403);

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
