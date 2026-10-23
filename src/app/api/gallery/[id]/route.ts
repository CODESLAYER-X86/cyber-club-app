import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";
import { deleteMediaFromStorage } from "@/lib/storage-cleanup";

const DELETE_ALLOWED_ROLES = ["MEDIA", "PRESIDENT", "PLATFORM_ADMIN"];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const galleryImage = await prisma.galleryImage.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { id: true, role: true },
        },
      },
    });

    if (!galleryImage) {
      return notFoundResponse("Gallery image not found");
    }

    // Check authorization via secure server session cookie
    const caller = await getSupabaseUser(DELETE_ALLOWED_ROLES);
    if (!caller) {
      return forbiddenResponse("Only MEDIA, PRESIDENT, or PLATFORM_ADMIN can delete gallery images");
    }

    // Purge the physical file from Cloudflare R2 / Supabase Storage
    await deleteMediaFromStorage(galleryImage.imageUrl);

    // Log to audit log before delete
    try {
      await prisma.auditLog.create({
        data: {
          userId: caller.userId,
          action: "GALLERY_PHOTO_DELETED",
          details: `Deleted gallery photo "${galleryImage.title}" (Category: ${galleryImage.category}). ID: ${id}`,
        },
      });
    } catch (auditErr) {
      console.error("Audit log error on gallery delete:", auditErr);
    }

    // Delete from database
    await prisma.galleryImage.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch {
    return serverErrorResponse();
  }
}
