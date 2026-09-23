import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";
import { isSafeUrl } from "@/lib/utils";

const UPDATE_ROLES = ["PRESIDENT", "VP", "GS", "MEDIA", "PLATFORM_ADMIN"];
const DELETE_ROLES = ["PRESIDENT", "VP", "GS", "MEDIA", "PLATFORM_ADMIN"];

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

    if (updateFields.imageUrl && !isSafeUrl(updateFields.imageUrl)) {
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

    // Build update data from allowed fields
    const allowedFields = ["name", "role", "description", "imageUrl", "department", "email", "order", "isActive"];
    const data: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in updateFields) {
        if (field === "order") {
          const parsed = typeof updateFields.order === "number" ? updateFields.order : parseInt(String(updateFields.order), 10);
          data.order = isNaN(parsed) ? 0 : parsed;
        } else {
          data[field] = updateFields[field];
        }
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

    // Log to audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: caller.userId,
          action: "COMMITTEE_MEMBER_UPDATED",
          details: `Updated committee member "${updatedMember.name}" (${updatedMember.role}). Fields: ${Object.keys(data).join(", ") || "none"}`,
        },
      });
    } catch (auditErr) {
      console.error("Audit log error on committee update:", auditErr);
    }

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

    // Log to audit log before delete
    try {
      await prisma.auditLog.create({
        data: {
          userId: caller.userId,
          action: "COMMITTEE_MEMBER_REMOVED",
          details: `Removed committee member "${member.name}" (${member.role}). ID: ${id}`,
        },
      });
    } catch (auditErr) {
      console.error("Audit log error on committee delete:", auditErr);
    }

    await prisma.committeeMember.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch {
    return serverErrorResponse();
  }
}
