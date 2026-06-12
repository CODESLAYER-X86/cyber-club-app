import prisma from "@/lib/db";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

const AUTHORIZED_ROLES = ["GS", "PRESIDENT", "PLATFORM_ADMIN"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    // Search filter: search by certificate code or user name
    let certificates;
    if (search) {
      // When searching, we need to filter by code or user name
      certificates = await prisma.certificate.findMany({
        where: {
          ...where,
          OR: [
            { certificateCode: { contains: search } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
          issuer: {
            select: {
              id: true,
              name: true,
            },
          },
          approver: {
            select: {
              id: true,
              name: true,
            },
          },
          revoker: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { issuedAt: "desc" },
      });
      // Filter by user name (in-memory since Prisma SQLite doesn't support relation filters well)
      certificates = certificates.filter(
        (c) =>
          c.certificateCode.toLowerCase().includes(search.toLowerCase()) ||
          c.user?.name?.toLowerCase().includes(search.toLowerCase())
      );
    } else {
      certificates = await prisma.certificate.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
          issuer: {
            select: {
              id: true,
              name: true,
            },
          },
          approver: {
            select: {
              id: true,
              name: true,
            },
          },
          revoker: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { issuedAt: "desc" },
      });
    }

    return successResponse({ certificates });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      eventId,
      type = "PARTICIPATION",
      score,
      issuedBy,
      role,
      eligibilityVerified = false,
      eligibilityDetails,
    } = body;

    // Authority check: Only GS, PRESIDENT, or PLATFORM_ADMIN can issue certificates
    if (!role || !AUTHORIZED_ROLES.includes(role)) {
      return forbiddenResponse(
        "Only GS, President, or Platform Admin can issue certificates"
      );
    }

    if (!userId || !eventId) {
      return errorResponse("userId and eventId are required");
    }

    if (!issuedBy) {
      return errorResponse("issuedBy (issuer user ID) is required");
    }

    // Determine certificate status based on type
    // EXCELLENCE type requires President approval -> PENDING_APPROVAL
    // PARTICIPATION/ACHIEVEMENT types -> VALID (GS can issue directly)
    const status = type === "EXCELLENCE" ? "PENDING_APPROVAL" : "VALID";

    // Generate unique certificate code
    const certificateCode = `CSC-${uuidv4().split("-")[0].toUpperCase()}-${uuidv4().split("-")[1].toUpperCase()}`;

    const certificate = await prisma.certificate.create({
      data: {
        certificateCode,
        userId,
        eventId,
        type,
        score,
        status,
        issuedBy,
        eligibilityVerified,
        eligibilityDetails: eligibilityDetails
          ? JSON.stringify(eligibilityDetails)
          : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        issuer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create CertificateAuditLog entry
    await prisma.certificateAuditLog.create({
      data: {
        certificateId: certificate.id,
        action: "ISSUED",
        performedBy: issuedBy,
        details: JSON.stringify({
          type,
          status,
          score,
          issuedBy,
          eligibilityVerified,
          eligibilityDetails: eligibilityDetails || null,
          issuedAt: new Date().toISOString(),
          requiresApproval: type === "EXCELLENCE",
        }),
      },
    });

    // Create notification for the certificate holder
    const notificationMessage =
      type === "EXCELLENCE"
        ? `You have been issued a ${type.toLowerCase()} certificate for "${certificate.event.title}". It is pending President approval. Code: ${certificateCode}`
        : `You have been issued a ${type.toLowerCase()} certificate for "${certificate.event.title}". Code: ${certificateCode}`;

    await prisma.notification.create({
      data: {
        userId,
        title:
          type === "EXCELLENCE"
            ? "Certificate Issued - Pending Approval"
            : "Certificate Issued",
        message: notificationMessage,
        type: type === "EXCELLENCE" ? "WARNING" : "SUCCESS",
      },
    });

    return successResponse({ certificate }, 201);
  } catch {
    return serverErrorResponse();
  }
}
