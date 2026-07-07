import prisma from "@/lib/db";
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const whereClause = includeInactive ? {} : { isActive: true };

    const sponsors = await prisma.clubSponsor.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return successResponse(sponsors);
  } catch (error) {
    console.error("Fetch Sponsors Error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const caller = await getSupabaseUser(["PRESIDENT", "PLATFORM_ADMIN", "GS", "TREASURER"]);
    if (!caller) {
      return forbiddenResponse("Only executives can manage official sponsors");
    }

    const body = await request.json();
    const { name, logoUrl, websiteUrl, description, priority, isActive } = body;

    if (!name || !logoUrl) {
      return errorResponse("Sponsor name and logo URL are required", 400);
    }

    const newSponsor = await prisma.clubSponsor.create({
      data: {
        name,
        logoUrl,
        websiteUrl: websiteUrl || null,
        description: description || null,
        priority: priority ? parseInt(priority) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      }
    });

    return successResponse(newSponsor, 201);
  } catch (error) {
    console.error("Create Sponsor Error:", error);
    return serverErrorResponse();
  }
}
