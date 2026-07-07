import prisma from "@/lib/db";
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const caller = await getSupabaseUser(["PRESIDENT", "PLATFORM_ADMIN", "GS", "TREASURER"]);
    if (!caller) return forbiddenResponse();

    const id = params.id;
    const body = await request.json();
    const { name, logoUrl, websiteUrl, description, priority, isActive } = body;

    const existing = await prisma.clubSponsor.findUnique({ where: { id } });
    if (!existing) return errorResponse("Sponsor not found", 404);

    const updated = await prisma.clubSponsor.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(logoUrl && { logoUrl }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority: parseInt(priority) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    });

    return successResponse(updated);
  } catch (error) {
    console.error("Update Sponsor Error:", error);
    return serverErrorResponse();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const caller = await getSupabaseUser(["PRESIDENT", "PLATFORM_ADMIN", "GS", "TREASURER"]);
    if (!caller) return forbiddenResponse();

    const id = params.id;
    const existing = await prisma.clubSponsor.findUnique({ where: { id } });
    if (!existing) return errorResponse("Sponsor not found", 404);

    await prisma.clubSponsor.delete({ where: { id } });
    return successResponse("Sponsor deleted successfully");
  } catch (error) {
    console.error("Delete Sponsor Error:", error);
    return serverErrorResponse();
  }
}
