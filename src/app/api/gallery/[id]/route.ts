import { unlink } from "fs/promises";
import path from "path";
import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

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

    // Delete the physical file if it is a local upload within public/
    try {
      if (
        galleryImage.imageUrl &&
        !galleryImage.imageUrl.startsWith("http://") &&
        !galleryImage.imageUrl.startsWith("https://") &&
        !galleryImage.imageUrl.startsWith("//") &&
        !galleryImage.imageUrl.includes("\0")
      ) {
        const publicDir = path.resolve(process.cwd(), "public");
        const filePath = path.resolve(publicDir, galleryImage.imageUrl.replace(/^\/+/, ""));
        if (filePath.startsWith(publicDir)) {
          await unlink(filePath);
        }
      }
    } catch {
      // File might not exist on disk, continue with DB deletion
    }

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
