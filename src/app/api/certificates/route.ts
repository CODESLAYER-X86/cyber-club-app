import prisma from "@/lib/db";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getSupabaseUser } from "@/lib/supabase-server";

const AUTHORIZED_ROLES = ["GS", "PRESIDENT", "PLATFORM_ADMIN"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const eventId = searchParams.get("eventId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (eventId) {
      where.eventId = eventId;

      // Auto-create/Self-heal missing certificates for approved registrations
      const approvedRegistrations = await prisma.eventRegistration.findMany({
        where: { eventId, status: "APPROVED" },
      });

      const existingCertificates = await prisma.certificate.findMany({
        where: { eventId },
      });

      const existingUserIds = new Set(existingCertificates.map((c) => c.userId));
      const missingRegs = approvedRegistrations.filter((r) => !existingUserIds.has(r.userId));

      if (missingRegs.length > 0) {
        // Fetch event to construct certificate code and check category
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          select: { category: true, status: true, requiresAssessment: true, passingScore: true }
        });
        const category = event?.category || "EVENT";

        // Fetch matching attendance records to determine initial status
        const attendances = await prisma.attendance.findMany({
          where: { eventId, userId: { in: missingRegs.map(r => r.userId) } }
        });

        // Fetch assessments if required to determine ELIGIBLE status
        let assessments: { id: string }[] = [];
        if (event?.requiresAssessment && event.passingScore !== null && event.passingScore !== undefined) {
          assessments = await prisma.assessment.findMany({
            where: { eventId },
            select: { id: true },
          });
        }

        await Promise.all(
          missingRegs.map(async (reg) => {
            const certificateCode = `CSC-2026-${category}-${uuidv4().split("-")[0].toUpperCase()}`;
            const att = attendances.find(a => a.userId === reg.userId);

            let initialStatus = "REGISTERED";
            if (att && (att.status === "PRESENT" || att.status === "LATE")) {
              initialStatus = "PRESENT";

              // Perform eligibility checks to see if we can promote it to ELIGIBLE
              let assessmentPassed = true;
              if (event?.requiresAssessment && event.passingScore !== null && event.passingScore !== undefined && assessments.length > 0) {
                assessmentPassed = false;
                const assessmentIds = assessments.map((a) => a.id);
                const passingSubmission = await prisma.assessmentSubmission.findFirst({
                  where: {
                    userId: reg.userId,
                    assessmentId: { in: assessmentIds },
                    status: "GRADED",
                    score: { gte: event.passingScore },
                  },
                });
                assessmentPassed = !!passingSubmission;
              }

              if (event?.status === "COMPLETED" && assessmentPassed) {
                initialStatus = "ELIGIBLE";
              }
            }

            await prisma.certificate.create({
              data: {
                certificateCode,
                userId: reg.userId,
                eventId,
                type: "PARTICIPATION",
                status: initialStatus,
              }
            });
          })
        );
      }
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

    // Fetch registrations and attendance to attach meta details
    let registrations: any[] = [];
    let attendanceRecords: any[] = [];
    const eventIds = Array.from(new Set(certificates.map((c) => c.eventId))) as string[];
    const userIds = Array.from(new Set(certificates.map((c) => c.userId))) as string[];
    if (eventIds.length > 0 && userIds.length > 0) {
      [registrations, attendanceRecords] = await Promise.all([
        prisma.eventRegistration.findMany({
          where: { 
            eventId: { in: eventIds },
            userId: { in: userIds }
          },
          select: {
            userId: true,
            eventId: true,
            preferredName: true,
            studentId: true,
            department: true,
            institution: true,
          },
        }),
        prisma.attendance.findMany({
          where: { 
            eventId: { in: eventIds },
            userId: { in: userIds }
          },
          select: {
            userId: true,
            eventId: true,
            status: true,
          },
        }),
      ]);
    }

    const certificatesWithReg = certificates.map((c: any) => {
      const reg = registrations.find(
        (r: any) => r.userId === c.userId && r.eventId === c.eventId
      );
      const att = attendanceRecords.find(
        (a: any) => a.userId === c.userId && a.eventId === c.eventId
      );
      return {
        ...c,
        registration: reg || null,
        attendance: att || null,
      };
    });

    return successResponse({ certificates: certificatesWithReg });
  } catch (error) {
    console.error("GET certificates error:", error);
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
      eligibilityVerified = false,
      eligibilityDetails,
    } = body;

    // Authority check: Only GS, PRESIDENT, or PLATFORM_ADMIN can issue certificates
    const caller = await getSupabaseUser(AUTHORIZED_ROLES);
    if (!caller) {
      return forbiddenResponse(
        "Only GS, President, or Platform Admin can issue certificates"
      );
    }
    const issuedBy = caller.userId;

    if (!userId || !eventId) {
      return errorResponse("userId and eventId are required");
    }

    // Determine certificate status based on type
    // EXCELLENCE/WINNER/PLACE types require President/GS approval -> ELIGIBLE
    // Standard types (PARTICIPATION, ORGANIZER, VOLUNTEER, etc.) -> AUTHORIZED
    const requiresApproval = ["EXCELLENCE", "WINNER", "FIRST_PLACE", "SECOND_PLACE", "THIRD_PLACE", "CUSTOM"].includes(type);
    const status = requiresApproval ? "ELIGIBLE" : "AUTHORIZED";

    // Check if certificate already exists (e.g. created during registration)
    const existingCert = await prisma.certificate.findFirst({
      where: { userId, eventId },
    });

    let certificate;
    if (existingCert) {
      certificate = await prisma.certificate.update({
        where: { id: existingCert.id },
        data: {
          type,
          score,
          status,
          issuedBy,
          eligibilityVerified,
          eligibilityDetails: eligibilityDetails
            ? JSON.stringify(eligibilityDetails)
            : null,
          issuedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          event: {
            select: { id: true, title: true },
          },
          issuer: {
            select: { id: true, name: true },
          },
        },
      });
    } else {
      // Generate unique certificate code
      const certificateCode = `CSC-2026-MANUAL-${uuidv4().split("-")[0].toUpperCase()}`;
      certificate = await prisma.certificate.create({
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
            select: { id: true, name: true, email: true },
          },
          event: {
            select: { id: true, title: true },
          },
          issuer: {
            select: { id: true, name: true },
          },
        },
      });
    }

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
        ? `You have been issued a ${type.toLowerCase()} certificate for "${certificate.event.title}". It is pending President approval. Code: ${certificate.certificateCode}`
        : `You have been issued a ${type.toLowerCase()} certificate for "${certificate.event.title}". Code: ${certificate.certificateCode}`;

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
