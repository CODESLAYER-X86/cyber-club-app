import prisma from "@/lib/db";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: certificateId } = await params;
    const body = await request.json();
    const { reason } = body;

    // Validate authority: Only PRESIDENT or PLATFORM_ADMIN can revoke
    const caller = await getSupabaseUser(["PRESIDENT", "PLATFORM_ADMIN"]);
    if (!caller) {
      return forbiddenResponse(
        "Only the President or Platform Admin can revoke certificates"
      );
    }
    const performedBy = caller.userId;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return errorResponse("A reason for revocation is required");
    }

    // Find the certificate
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        event: {
          select: { id: true, title: true, category: true },
        },
      },
    });

    if (!certificate) {
      return notFoundResponse("Certificate not found");
    }

    // Check if already revoked
    if (certificate.status === "REVOKED") {
      return errorResponse("Certificate is already revoked");
    }

    // Update the certificate
    const updatedCertificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: "REVOKED",
        revokedBy: performedBy,
        revokedAt: new Date(),
        revocationReason: reason.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        event: {
          select: { id: true, title: true, category: true },
        },
        issuer: {
          select: { id: true, name: true },
        },
        approver: {
          select: { id: true, name: true },
        },
        revoker: {
          select: { id: true, name: true },
        },
      },
    });

    // Create audit log entry
    await prisma.certificateAuditLog.create({
      data: {
        certificateId,
        action: "REVOKED",
        performedBy,
        details: JSON.stringify({
          reason: reason.trim(),
          previousStatus: certificate.status,
          revokedAt: new Date().toISOString(),
        }),
      },
    });

    // Create notification for the certificate holder
    await prisma.notification.create({
      data: {
        userId: certificate.userId,
        title: "Certificate Revoked",
        message: `Your ${certificate.type.toLowerCase()} certificate for "${certificate.event.title}" has been revoked. Reason: ${reason.trim()}`,
        type: "ERROR",
      },
    });

    return successResponse({ certificate: updatedCertificate });
  } catch {
    return serverErrorResponse();
  }
}
