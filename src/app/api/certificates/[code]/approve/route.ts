import prisma from "@/lib/db";
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

    // Check if certificate is pending approval or eligible for authorization
    if (certificate.status !== "PENDING_APPROVAL" && certificate.status !== "ELIGIBLE") {
      return errorResponse(
        "Certificate is not in a status that can be authorized. Current status: " +
          certificate.status
      );
    }

    // Update the certificate to AUTHORIZED status
    const updatedCertificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        approvedBy: performedBy,
        status: "AUTHORIZED",
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
        action: "APPROVED",
        performedBy,
        details: JSON.stringify({
          previousStatus: certificate.status,
          newStatus: "AUTHORIZED",
          approvedAt: new Date().toISOString(),
        }),
      },
    });

    // Create notification for the certificate holder
    await prisma.notification.create({
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
