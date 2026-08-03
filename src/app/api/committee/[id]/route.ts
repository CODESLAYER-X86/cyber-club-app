import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

const UPDATE_ROLES = ["PRESIDENT", "GS", "MEDIA", "PLATFORM_ADMIN"];
const DELETE_ROLES = ["PRESIDENT", "GS", "MEDIA", "PLATFORM_ADMIN"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const caller = await getSupabaseUser(UPDATE_ROLES);
    if (!caller) {
      return forbiddenResponse("Only PRESIDENT, GS, MEDIA, or PLATFORM_ADMIN can update committee members");
    }
    const { socialLinks, ...updateFields } = body;

    const member = await prisma.committeeMember.findUnique({
      where: { id },
    });

    if (!member) {
      return notFoundResponse("Committee member not found");
    }

    // Build update data from allowed fields
    const allowedFields = ["name", "role", "description", "imageUrl", "department", "email", "order", "isActive"];
    const data: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in updateFields) {
        data[field] = updateFields[field];
      }
    }

    // Handle socialLinks separately (serialize to JSON)
    if (socialLinks !== undefined) {
      data.socialLinks = JSON.stringify(socialLinks);
    }

    const updatedMember = await prisma.committeeMember.update({
      where: { id },
      data,
    });

    return successResponse({ member: updatedMember });
  } catch {
    return serverErrorResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authorization via secure server session cookie
    const caller = await getSupabaseUser(DELETE_ROLES);
    if (!caller) {
      return forbiddenResponse("Only PRESIDENT, GS, MEDIA, or PLATFORM_ADMIN can delete committee members");
    }

    const member = await prisma.committeeMember.findUnique({
      where: { id },
    });

    if (!member) {
      return notFoundResponse("Committee member not found");
    }

    await prisma.committeeMember.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch {
    return serverErrorResponse();
  }
}
