import prisma from "@/lib/db";
import { successResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";
import { CATEGORY_ACTIONS, pruneAuditLogsIfExceeded } from "@/lib/audit";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const ALLOWED_ROLES = ["PRESIDENT", "PLATFORM_ADMIN", "GS", "VP"];
    const caller = await getSupabaseUser(ALLOWED_ROLES);
    if (!caller) {
      return forbiddenResponse("Only President, VP, GS, and Platform Admin can view audit logs");
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const category = searchParams.get("category");
    const q = searchParams.get("q") || searchParams.get("search");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const conditions: Prisma.AuditLogWhereInput[] = [];

    if (userId) {
      conditions.push({ userId });
    }

    if (action) {
      conditions.push({ action: { contains: action, mode: "insensitive" } });
    } else if (category && category !== "ALL" && CATEGORY_ACTIONS[category]) {
      conditions.push({ action: { in: CATEGORY_ACTIONS[category] } });
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      conditions.push({
        OR: [
          { action: { contains: searchTerm, mode: "insensitive" } },
          { details: { contains: searchTerm, mode: "insensitive" } },
          { user: { name: { contains: searchTerm, mode: "insensitive" } } },
          { user: { email: { contains: searchTerm, mode: "insensitive" } } },
          { user: { studentId: { contains: searchTerm, mode: "insensitive" } } },
          { user: { transactionId: { contains: searchTerm, mode: "insensitive" } } },
        ],
      });
    }

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const timeframe = searchParams.get("timeframe");

    if (startDate || endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      conditions.push({ createdAt: dateFilter });
    } else if (timeframe && timeframe !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (timeframe === "2d") {
        cutoff.setDate(now.getDate() - 2);
        cutoff.setHours(0, 0, 0, 0);
      } else if (timeframe === "1d") {
        cutoff.setDate(now.getDate() - 1);
        cutoff.setHours(0, 0, 0, 0);
      } else if (timeframe === "7d") {
        cutoff.setDate(now.getDate() - 7);
        cutoff.setHours(0, 0, 0, 0);
      } else if (timeframe === "30d" || timeframe === "1m") {
        cutoff.setDate(now.getDate() - 30);
        cutoff.setHours(0, 0, 0, 0);
      }
      conditions.push({ createdAt: { gte: cutoff } });
    }

    const where: Prisma.AuditLogWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const queryArgs: Prisma.AuditLogFindManyArgs = {
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            transactionId: true,
            studentId: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    };

    if (cursor) {
      queryArgs.cursor = { id: cursor };
      queryArgs.skip = 1;
    } else if (offset > 0) {
      queryArgs.skip = offset;
    }

    const [rawLogs, total, todayCount] = await Promise.all([
      prisma.auditLog.findMany(queryArgs),
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({
        where: {
          ...where,
          createdAt: { gte: todayStart },
        },
      }),
    ]);

    const hasMore = rawLogs.length > limit;
    const auditLogs = hasMore ? rawLogs.slice(0, limit) : rawLogs;
    const nextCursor = hasMore && auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].id : null;

    return successResponse({
      auditLogs,
      total,
      todayCount,
      limit,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("GET /api/audit-logs error:", error);
    return serverErrorResponse();
  }
}

export async function DELETE() {
  try {
    const caller = await getSupabaseUser(["PLATFORM_ADMIN", "PRESIDENT"]);
    if (!caller) {
      return forbiddenResponse("Only Platform Admin and President can perform audit log maintenance");
    }

    const prunedCount = await pruneAuditLogsIfExceeded(100000);

    return successResponse({
      message: `Audit log pruning completed. ${prunedCount} older logs purged.`,
      prunedCount,
    });
  } catch (error) {
    console.error("DELETE /api/audit-logs error:", error);
    return serverErrorResponse();
  }
}
