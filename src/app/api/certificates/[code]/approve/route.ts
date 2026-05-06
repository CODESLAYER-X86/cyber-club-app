import { db } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: certificateId } = await params;
    const body = await request.json();
    const { performedBy, role } = body;

    // Validate authority: Only PRESIDENT can approve
    if (role !== "PRESIDENT") {
      return forbiddenResponse(
        "Only the President can approve certificates"
      );
    }

    // Validate required fields
    if (!performedBy) {
      return errorResponse("performedBy (user ID) is required");
    }

    // Find the certificate
    const certificate = await db.certificate.findUnique({
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

    // Check if certificate is pending approval
    if (certificate.status !== "PENDING_APPROVAL") {
      return errorResponse(
        "Certificate is not pending approval. Current status: " +
          certificate.status
      );
    }

    // Update the certificate
    const updatedCertificate = await db.certificate.update({
      where: { id: certificateId },
      data: {
        approvedBy: performedBy,
        status: "VALID",
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
    await db.certificateAuditLog.create({
      data: {
        certificateId,
        action: "APPROVED",
        performedBy,
        details: JSON.stringify({
          previousStatus: "PENDING_APPROVAL",
          newStatus: "VALID",
          approvedAt: new Date().toISOString(),
        }),
      },
    });

    // Create notification for the certificate holder
    await db.notification.create({
      data: {
        userId: certificate.userId,
        title: "Certificate Approved",
        message: `Your ${certificate.type.toLowerCase()} certificate for "${certificate.event.title}" has been approved by the President. Certificate code: ${certificate.certificateCode}`,
        type: "SUCCESS",
      },
    });

    return successResponse({ certificate: updatedCertificate });
  } catch {
    return serverErrorResponse();
  }
}
