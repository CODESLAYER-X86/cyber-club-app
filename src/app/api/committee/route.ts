import prisma from "@/lib/db";
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { getSupabaseUser } from "@/lib/supabase-server";
import { isSafeUrl } from "@/lib/utils";
import { NextRequest } from "next/server";

const CREATE_ROLES = ["PRESIDENT", "VP", "GS", "MEDIA", "PLATFORM_ADMIN"];

export async function GET(request: NextRequest) {
  try {
    const session = request.nextUrl.searchParams.get("session");
    const whereClause: Record<string, unknown> = { isActive: true };

    if (session && session !== "all") {
      whereClause.session = session;
    }

    const members = await prisma.committeeMember.findMany({
      where: whereClause,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true, // Required for card edit/delete and React tracking
        name: true,
        role: true,
        description: true,
        imageUrl: true,
        department: true,
        email: true,
        socialLinks: true,
        order: true,
        session: true,
        isCurrent: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Extract distinct sessions available in the system
    const sessionRecords = await prisma.committeeMember.findMany({
      where: { isActive: true },
      select: { session: true, isCurrent: true },
      distinct: ["session"],
      orderBy: { session: "desc" },
    });

    const sessionSet = new Set<string>();
    let currentSession = "2025-2026";

    sessionRecords.forEach((r) => {
      if (r.session) {
        sessionSet.add(r.session);
        if (r.isCurrent) {
          currentSession = r.session;
        }
      }
    });

    // Guarantee default active session exists in the list
    sessionSet.add("2025-2026");
    const availableSessions = Array.from(sessionSet).sort().reverse();

    return successResponse({ members, availableSessions, currentSession });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get role from server session — NEVER from client body
    const caller = await getSupabaseUser(CREATE_ROLES);
    if (!caller) return forbiddenResponse("Only PRESIDENT, GS, MEDIA, or PLATFORM_ADMIN can create committee members");

    const body = await request.json();
    const { name, role, description, imageUrl, department, email, socialLinks, order, session, isCurrent } = body;

    if (!name || !role || !description) {
      return errorResponse("name, role, and description are required");
    }

    if (imageUrl && !isSafeUrl(imageUrl)) {
      return errorResponse("Invalid or unsafe imageUrl");
    }

    if (socialLinks && typeof socialLinks === "object") {
      for (const [key, val] of Object.entries(socialLinks)) {
        if (key === "category") continue;
        if (typeof val === "string" && val.trim() && !isSafeUrl(val)) {
          return errorResponse(`Invalid or unsafe social link for ${key}`);
        }
      }
    }

    const assignedSession = (typeof session === "string" && session.trim()) ? session.trim() : "2025-2026";
    const assignedIsCurrent = typeof isCurrent === "boolean" ? isCurrent : (assignedSession === "2025-2026");

    const member = await prisma.committeeMember.create({
      data: {
        name,
        role,
        description,
        imageUrl,
        department,
        email,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
        order: typeof order === "number" ? order : parseInt(String(order), 10) || 0,
        session: assignedSession,
        isCurrent: assignedIsCurrent,
      },
    });

    // Log to audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: caller.userId,
          action: "COMMITTEE_MEMBER_ADDED",
          details: `Appointed "${name}" as committee member (${role}${department ? `, ${department}` : ""}). ID: ${member.id}`,
        },
      });
    } catch (auditErr) {
      console.error("Audit log error on committee add:", auditErr);
    }

    return successResponse({ member }, 201);
  } catch {
    return serverErrorResponse();
  }
}
