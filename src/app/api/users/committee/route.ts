import { db } from "@/lib/db";
import { successResponse, serverErrorResponse } from "@/lib/api-utils";

const LEADERSHIP_ROLES = ["PRESIDENT", "VP", "GS", "TREASURER", "MEDIA", "VERIFIER"];

// Role hierarchy for sorting
const ROLE_ORDER: Record<string, number> = {
  PRESIDENT: 0,
  VP: 1,
  GS: 2,
  TREASURER: 3,
  MEDIA: 4,
  VERIFIER: 5,
};

export async function GET() {
  try {
    const users = await db.user.findMany({
      where: {
        role: { in: LEADERSHIP_ROLES },
        membershipStatus: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        role: true,
        department: true,
        bio: true,
        avatar: true,
        studentId: true,
        email: true,
      },
    });

    // Sort by role hierarchy
    const sorted = users.sort((a, b) => {
      const aOrder = ROLE_ORDER[a.role] ?? 99;
      const bOrder = ROLE_ORDER[b.role] ?? 99;
      return aOrder - bOrder;
    });

    return successResponse({ users: sorted });
  } catch {
    return serverErrorResponse();
  }
}
