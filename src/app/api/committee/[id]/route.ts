import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

const UPDATE_ROLES = ["PRESIDENT", "GS", "PLATFORM_ADMIN"];
const DELETE_ROLES = ["PRESIDENT", "PLATFORM_ADMIN"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { requesterRole, socialLinks, ...updateFields } = body;

    if (!requesterRole || !UPDATE_ROLES.includes(requesterRole)) {
      return forbiddenResponse("Only PRESIDENT, GS, or PLATFORM_ADMIN can update committee members");
    }

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

    // Check authorization from query params
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");

    if (!role || !DELETE_ROLES.includes(role)) {
      return forbiddenResponse("Only PRESIDENT or PLATFORM_ADMIN can delete committee members");
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
