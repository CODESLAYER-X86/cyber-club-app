import prisma from "@/lib/db";
import { successResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

const ALLOWED_ROLES = ["PLATFORM_ADMIN", "PRESIDENT", "VP", "GS"];

export async function GET(request: NextRequest) {
  try {
    const caller = await getSupabaseUser(ALLOWED_ROLES);
    if (!caller) {
      return forbiddenResponse("Only Certificate Authority executives can view audit logs");
    }

    const searchParams = request.nextUrl.searchParams;
    const certificateId = searchParams.get("certificateId");
    const performedBy = searchParams.get("performedBy");

    const where: Record<string, unknown> = {};

    if (certificateId) {
      where.certificateId = certificateId;
    }

    if (performedBy) {
      where.performedBy = performedBy;
    }

    const auditLogs = await prisma.certificateAuditLog.findMany({
      where,
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        certificate: {
          select: {
            id: true,
            certificateCode: true,
            type: true,
            status: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            event: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ auditLogs });
  } catch {
    return serverErrorResponse();
  }
}
