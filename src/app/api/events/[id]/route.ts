import prisma from "@/lib/db";
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse, forbiddenResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";
import { isSafeUrl } from "@/lib/utils";

const DELETE_ROLES = ["PRESIDENT", "PLATFORM_ADMIN"];
const MODIFY_ROLES = ["PRESIDENT", "PLATFORM_ADMIN", "MEDIA", "VP", "GS"];
const FINANCIAL_ROLES = ["PRESIDENT", "GS", "PLATFORM_ADMIN"];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caller = await getSupabaseUser(DELETE_ROLES);
    if (!caller) {
      return forbiddenResponse("Only President and Platform Admin can delete events");
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return notFoundResponse("Event not found");
    }

    // Capture complete snapshot before deleting for forensic recovery
    try {
      let parsedPaymentConfig: any = null;
      if (event.paymentConfig) {
        try {
          parsedPaymentConfig = JSON.parse(event.paymentConfig);
        } catch {
          parsedPaymentConfig = event.paymentConfig;
        }
      }

      const eventSnapshot = {
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
        venue: event.venue,
        fee: event.fee,
        maxSeats: event.maxSeats,
        currentSeats: event.currentSeats,
        status: event.status,
        poster: event.poster,
        paymentConfig: parsedPaymentConfig,
        createdBy: event.createdBy,
      };

      await prisma.auditLog.create({
        data: {
          userId: caller.userId,
          action: "EVENT_DELETED",
          details: `Deleted event "${event.title}" (${event.type}, ${event.category}, Fee: ৳${event.fee}). Event ID: ${id} | Deleted by ${caller.role}. [SNAPSHOT]: ${JSON.stringify(eventSnapshot)}`,
        },
      });
    } catch (auditErr) {
      console.error("Audit log error on event deletion:", auditErr);
    }

    // Delete related records first (in correct dependency order)
    // 1. Certificate audit logs (depend on certificates)
    const eventCertificates = await prisma.certificate.findMany({ where: { eventId: id }, select: { id: true } });
    if (eventCertificates.length > 0) {
      await prisma.certificateAuditLog.deleteMany({
        where: { certificateId: { in: eventCertificates.map(c => c.id) } },
      });
    }
    // 2. Certificates
    await prisma.certificate.deleteMany({ where: { eventId: id } });
    // 3. Assessment submissions (depend on assessments)
    const eventAssessments = await prisma.assessment.findMany({ where: { eventId: id }, select: { id: true } });
    if (eventAssessments.length > 0) {
      await prisma.assessmentSubmission.deleteMany({
        where: { assessmentId: { in: eventAssessments.map(a => a.id) } },
      });
    }
    // 4. Assessments
    await prisma.assessment.deleteMany({ where: { eventId: id } });
    // 5. Attendance
    await prisma.attendance.deleteMany({ where: { eventId: id } });
    // 6. Registrations
    await prisma.eventRegistration.deleteMany({ where: { eventId: id } });
    // 7. Gallery images (unlink, don't delete the images themselves)
    await prisma.galleryImage.updateMany({ where: { eventId: id }, data: { eventId: null } });
    // 8. Payments (unlink, don't delete payment records)
    await prisma.payment.updateMany({ where: { eventId: id }, data: { eventId: null } });
    // 9. Finally, delete the event
    await prisma.event.delete({ where: { id } });

    return successResponse({ message: "Event deleted successfully" });
  } catch {
    return serverErrorResponse();
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                membershipStatus: true,
                studentId: true,
                rollNumber: true,
                batch: true,
                department: true,
                phone: true,
              },
            },
          },
          orderBy: { registeredAt: "desc" },
        },
        attendance: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        certificates: {
          select: {
            id: true,
            userId: true,
            type: true,
            status: true,
            certificateCode: true,
            score: true,
            issuedAt: true,
            issuedBy: true,
            approvedBy: true,
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return notFoundResponse("Event not found");
    }

    // Auth & Permission check
    const caller = await getSupabaseUser();
    const isMemberOrHigher = !!(caller && caller.role !== "GUEST");

    // Guard: If event is MEMBER_ONLY, unauthenticated or guest users cannot view it
    if (event.type === "MEMBER_ONLY" && !isMemberOrHigher) {
      return forbiddenResponse("This event is exclusively for registered club members");
    }

    const isLeadershipOrVerifier = !!(caller && (
      ["PLATFORM_ADMIN", "PRESIDENT", "VP", "GS", "TREASURER", "VERIFIER"].includes(caller.role) ||
      caller.userId === event.verifierId ||
      caller.userId === event.createdBy
    ));

    // Fetch payments for this event to link transactionId/payment info
    let payments: any[] = [];
    if (isLeadershipOrVerifier) {
      payments = await prisma.payment.findMany({
        where: { eventId: id },
        select: {
          id: true,
          userId: true,
          amount: true,
          status: true,
          transactionId: true,
          proofUrl: true,
          createdAt: true,
        },
      });
    } else if (caller) {
      payments = await prisma.payment.findMany({
        where: { eventId: id, userId: caller.userId },
        select: {
          id: true,
          userId: true,
          amount: true,
          status: true,
          transactionId: true,
          proofUrl: true,
          createdAt: true,
        },
      });
    }

    // Filter registrations: leadership sees all; general users see only their own
    const visibleRegistrations = isLeadershipOrVerifier
      ? event.registrations
      : (caller ? event.registrations.filter((r) => r.userId === caller.userId) : []);

    const registrationsWithPayment = visibleRegistrations.map((reg) => {
      const payment = payments.find((p) => p.userId === reg.userId);
      return {
        ...reg,
        payment: payment
          ? {
              id: payment.id,
              amount: payment.amount,
              status: payment.status,
              transactionId: payment.transactionId,
              proofUrl: payment.proofUrl,
              createdAt: payment.createdAt,
            }
          : null,
      };
    });

    // Filter attendance and certificates: leadership sees all; general users see only their own
    const visibleAttendance = isLeadershipOrVerifier
      ? event.attendance
      : (caller ? event.attendance.filter((a) => a.userId === caller.userId) : []);

    const visibleCertificates = isLeadershipOrVerifier
      ? event.certificates
      : (caller ? event.certificates.filter((c) => c.userId === caller.userId) : []);

    let paymentConfig = event.paymentConfig;
    if (!isMemberOrHigher && paymentConfig) {
      try {
        const parsed = typeof paymentConfig === "string" ? JSON.parse(paymentConfig) : paymentConfig;
        paymentConfig = JSON.stringify({
          paymentRequired: !!parsed.paymentRequired,
          feeAmount: parsed.feeAmount || 0,
          paymentDeadline: parsed.paymentDeadline || "",
          paymentInstructions: parsed.paymentInstructions || "",
        });
      } catch {
        paymentConfig = null;
      }
    }

    const eventWithPayments = {
      ...event,
      creator: event.creator
        ? {
            ...event.creator,
            email: isLeadershipOrVerifier ? event.creator.email : undefined,
          }
        : null,
      verifier: event.verifier
        ? {
            ...event.verifier,
            email: isLeadershipOrVerifier ? event.verifier.email : undefined,
          }
        : null,
      certificateLayout: isLeadershipOrVerifier ? event.certificateLayout : null,
      paymentConfig,
      registrations: registrationsWithPayment,
      attendance: visibleAttendance,
      certificates: visibleCertificates,
    };

    return successResponse({ event: eventWithPayments });
  } catch {
    return serverErrorResponse();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const caller = await getSupabaseUser(MODIFY_ROLES);
    if (!caller) {
      return forbiddenResponse("Only President, VP, General Secretary, Media, and Platform Admin can modify events");
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return notFoundResponse("Event not found");
    }

    // Role guard: Only President, GS, and Platform Admin can alter paymentConfig or fees
    const isFinancialAdmin = FINANCIAL_ROLES.includes(caller.role);
    if (!isFinancialAdmin) {
      if (body.fee !== undefined && Number(body.fee) !== Number(event.fee)) {
        return forbiddenResponse("Only President, General Secretary, and Platform Admin can modify event fee");
      }
      if (body.paymentConfig !== undefined) {
        let incomingNormalized: string | null = null;
        if (body.paymentConfig !== null) {
          try {
            incomingNormalized = typeof body.paymentConfig === "string"
              ? JSON.stringify(JSON.parse(body.paymentConfig))
              : JSON.stringify(body.paymentConfig);
          } catch {
            return errorResponse("Invalid paymentConfig JSON payload", 400);
          }
        }
        let existingNormalized: string | null = null;
        if (event.paymentConfig !== null) {
          try {
            existingNormalized = JSON.stringify(JSON.parse(event.paymentConfig));
          } catch {
            existingNormalized = event.paymentConfig;
          }
        }
        if (incomingNormalized !== existingNormalized) {
          return forbiddenResponse("Only President, General Secretary, and Platform Admin can modify event payment configuration");
        }
      }
    }

    const allowedFields = [
      "title",
      "description",
      "type",
      "category",
      "startDate",
      "endDate",
      "venue",
      "fee",
      "maxSeats",
      "poster",
      "status",
      "requiresAssessment",
      "passingScore",
      "verifierId",
      "certificateLayout",
      "paymentConfig",
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "type") {
          data[field] = body[field] === "MEMBER_ONLY" ? "MEMBER_ONLY" : "PUBLIC";
        } else if (field === "startDate" || field === "endDate") {
          data[field] = new Date(body[field]);
        } else if (field === "poster") {
          if (body[field] && !isSafeUrl(body[field])) {
            return errorResponse("Invalid or unsafe poster URL", 400);
          }
          data[field] = body[field] || null;
        } else if (field === "fee") {
          data[field] = Number(body[field]) || 0;
        } else if (field === "maxSeats") {
          data[field] = body[field] ? parseInt(String(body[field]), 10) : null;
        } else if (field === "passingScore") {
          data[field] = body[field] !== null && body[field] !== undefined && body[field] !== "" ? parseFloat(String(body[field])) : null;
        } else if (field === "paymentConfig") {
          if (body[field] === null) {
            data[field] = null;
          } else if (typeof body[field] === "string") {
            try {
              JSON.parse(body[field]);
              data[field] = body[field];
            } catch {
              return errorResponse("Invalid paymentConfig JSON payload", 400);
            }
          } else if (typeof body[field] === "object") {
            data[field] = JSON.stringify(body[field]);
          }
        } else if (field === "certificateLayout") {
          if (body[field] === null) {
            data[field] = null;
          } else if (typeof body[field] === "string") {
            data[field] = body[field];
          } else if (typeof body[field] === "object") {
            data[field] = JSON.stringify(body[field]);
          }
        } else {
          data[field] = body[field];
        }
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (body.status === "COMPLETED" && event.status !== "COMPLETED") {
      // Fetch all attendance records for this event that are PRESENT or LATE
      const presentAttendance = await prisma.attendance.findMany({
        where: { eventId: id, status: { in: ["PRESENT", "LATE"] } },
        select: { userId: true },
      });

      const userIds = presentAttendance.map((a) => a.userId);

      if (userIds.length > 0) {
        // Fetch registrations to see who is APPROVED
        const approvedRegistrations = await prisma.eventRegistration.findMany({
          where: { eventId: id, userId: { in: userIds }, status: "APPROVED" },
          select: { userId: true },
        });
        const approvedUserIds = new Set(approvedRegistrations.map((r) => r.userId));

        // If assessment is required, check who passed
        let eligibleUserIds = userIds.filter((uid) => approvedUserIds.has(uid));

        if (updatedEvent.requiresAssessment && updatedEvent.passingScore !== null && updatedEvent.passingScore !== undefined) {
          const assessments = await prisma.assessment.findMany({
            where: { eventId: id },
            select: { id: true },
          });

          if (assessments.length > 0) {
            const assessmentIds = assessments.map((a) => a.id);
            // Find who passed
            const passingSubmissions = await prisma.assessmentSubmission.findMany({
              where: {
                assessmentId: { in: assessmentIds },
                userId: { in: eligibleUserIds },
                status: "GRADED",
                score: { gte: updatedEvent.passingScore },
              },
              select: { userId: true },
            });
            const passedUserIds = new Set(passingSubmissions.map((s) => s.userId));
            eligibleUserIds = eligibleUserIds.filter((uid) => passedUserIds.has(uid));
          } else {
            // No assessments created yet, so they are not eligible
            eligibleUserIds = [];
          }
        }

        if (eligibleUserIds.length > 0) {
          // Promote certificates for eligible users to ELIGIBLE
          await prisma.certificate.updateMany({
            where: {
              eventId: id,
              userId: { in: eligibleUserIds },
              status: { in: ["REGISTERED", "PRESENT"] },
            },
            data: { status: "ELIGIBLE" },
          });
        }
      }
    }

    // Log to audit log with granular field diffs
    try {
      interface FieldDiff {
        field: string;
        oldValue: string;
        newValue: string;
      }
      const generalDiffs: FieldDiff[] = [];
      const paymentDiffs: FieldDiff[] = [];

      // Diff scalar fields
      if (data.title !== undefined && data.title !== event.title) {
        generalDiffs.push({ field: "Title", oldValue: event.title, newValue: String(data.title) });
      }
      if (data.description !== undefined && data.description !== event.description) {
        generalDiffs.push({ field: "Description", oldValue: "(old description)", newValue: "(updated description)" });
      }
      if (data.type !== undefined && data.type !== event.type) {
        generalDiffs.push({ field: "Type", oldValue: event.type, newValue: String(data.type) });
      }
      if (data.category !== undefined && data.category !== event.category) {
        generalDiffs.push({ field: "Category", oldValue: event.category, newValue: String(data.category) });
      }
      if (data.venue !== undefined && data.venue !== event.venue) {
        generalDiffs.push({ field: "Venue", oldValue: event.venue, newValue: String(data.venue) });
      }
      if (data.fee !== undefined && Number(data.fee) !== Number(event.fee)) {
        paymentDiffs.push({ field: "Event Fee", oldValue: `৳${event.fee}`, newValue: `৳${data.fee}` });
      }
      if (data.maxSeats !== undefined && data.maxSeats !== event.maxSeats) {
        generalDiffs.push({
          field: "Max Seats",
          oldValue: event.maxSeats !== null ? String(event.maxSeats) : "Unlimited",
          newValue: data.maxSeats !== null ? String(data.maxSeats) : "Unlimited",
        });
      }
      if (data.status !== undefined && data.status !== event.status) {
        generalDiffs.push({ field: "Status", oldValue: event.status, newValue: String(data.status) });
      }
      if (data.poster !== undefined && data.poster !== event.poster) {
        generalDiffs.push({ field: "Poster", oldValue: event.poster ? "Attached" : "None", newValue: data.poster ? "Updated" : "Removed" });
      }
      if (data.startDate !== undefined) {
        const oldTime = new Date(event.startDate).getTime();
        const newTime = new Date(data.startDate as Date).getTime();
        if (oldTime !== newTime) {
          generalDiffs.push({
            field: "Start Date",
            oldValue: new Date(event.startDate).toLocaleString(),
            newValue: new Date(data.startDate as Date).toLocaleString(),
          });
        }
      }
      if (data.endDate !== undefined) {
        const oldTime = new Date(event.endDate).getTime();
        const newTime = new Date(data.endDate as Date).getTime();
        if (oldTime !== newTime) {
          generalDiffs.push({
            field: "End Date",
            oldValue: new Date(event.endDate).toLocaleString(),
            newValue: new Date(data.endDate as Date).toLocaleString(),
          });
        }
      }

      // Diff paymentConfig sub-properties
      if (data.paymentConfig !== undefined) {
        let oldPc: Record<string, any> = {};
        let newPc: Record<string, any> = {};
        try {
          if (event.paymentConfig) oldPc = typeof event.paymentConfig === "string" ? JSON.parse(event.paymentConfig) : event.paymentConfig;
        } catch {}
        try {
          if (data.paymentConfig) newPc = typeof data.paymentConfig === "string" ? JSON.parse(data.paymentConfig as string) : (data.paymentConfig as Record<string, any>);
        } catch {}

        const checkSubField = (key: string, label: string, isCurrency = false) => {
          const oldVal = (oldPc[key] ?? "").toString().trim();
          const newVal = (newPc[key] ?? "").toString().trim();
          if (oldVal !== newVal) {
            paymentDiffs.push({
              field: label,
              oldValue: oldVal ? (isCurrency ? `৳${oldVal}` : oldVal) : "[Not set / Empty]",
              newValue: newVal ? (isCurrency ? `৳${newVal}` : newVal) : "[Cleared / Deleted]",
            });
          }
        };

        checkSubField("bkashNumber", "bKash Number");
        checkSubField("nagadNumber", "Nagad Number");
        checkSubField("rocketNumber", "Rocket Number");
        checkSubField("bankAccount", "Bank Account");
        checkSubField("feeAmount", "Payment Config Fee", true);
        checkSubField("paymentInstructions", "Payment Instructions");
        checkSubField("contactPersonName", "Contact Person Name");
        checkSubField("contactPersonPhone", "Contact Person Phone");
        checkSubField("paymentDeadline", "Payment Deadline");
        if (Boolean(oldPc.paymentRequired) !== Boolean(newPc.paymentRequired)) {
          paymentDiffs.push({
            field: "Payment Required",
            oldValue: oldPc.paymentRequired ? "Yes" : "No",
            newValue: newPc.paymentRequired ? "Yes" : "No",
          });
        }
      }

      // If financial details or payment numbers were modified:
      if (paymentDiffs.length > 0) {
        const paymentSummary = paymentDiffs.map(d => `${d.field}: ${d.oldValue} ➔ ${d.newValue}`).join("; ");
        const auditDetails = `Payment configuration modified for event "${updatedEvent.title}" (Event ID: ${id}): ${paymentSummary} | Modified by ${caller.role}. [DIFF_DATA]: ${JSON.stringify({ eventId: id, eventTitle: updatedEvent.title, category: "FINANCE", diffs: paymentDiffs })}`;

        await prisma.auditLog.create({
          data: {
            userId: caller.userId,
            action: "EVENT_PAYMENT_CONFIG_CHANGED",
            details: auditDetails,
          },
        });

        // Trigger real-time notifications to President and Treasurer
        try {
          const recipients = await prisma.user.findMany({
            where: {
              role: { in: ["PRESIDENT", "TREASURER"] },
              id: { not: caller.userId },
            },
            select: { id: true },
          });

          if (recipients.length > 0) {
            const shortSummary = paymentDiffs.map(d => `${d.field} (${d.oldValue} ➔ ${d.newValue})`).join(", ");
            await prisma.notification.createMany({
              data: recipients.map((r) => ({
                userId: r.id,
                title: "⚠️ Event Payment Routing Modified",
                message: `${caller.role} modified payment channels/fees on "${updatedEvent.title}": ${shortSummary}`,
                type: "WARNING",
              })),
            });
          }
        } catch (notifErr) {
          console.error("Failed to notify leadership about payment config change:", notifErr);
        }
      }

      // If non-financial general fields were modified:
      if (generalDiffs.length > 0) {
        const generalSummary = generalDiffs.map(d => `${d.field}: ${d.oldValue} ➔ ${d.newValue}`).join("; ");
        const auditDetails = `Updated event "${updatedEvent.title}" (Event ID: ${id}): ${generalSummary} | Modified by ${caller.role}. [DIFF_DATA]: ${JSON.stringify({ eventId: id, eventTitle: updatedEvent.title, category: "SYSTEM", diffs: generalDiffs })}`;

        await prisma.auditLog.create({
          data: {
            userId: caller.userId,
            action: "EVENT_UPDATED",
            details: auditDetails,
          },
        });
      } else if (paymentDiffs.length === 0) {
        // Fallback for unchanged or un-diffed fields
        const changedFields = Object.keys(data).join(", ");
        await prisma.auditLog.create({
          data: {
            userId: caller.userId,
            action: "EVENT_UPDATED",
            details: `Updated event "${updatedEvent.title}" (Fields modified: ${changedFields || "none"}). Event ID: ${id}`,
          },
        });
      }
    } catch (auditErr) {
      console.error("Audit log error on event update:", auditErr);
    }

    return successResponse({ event: updatedEvent });
  } catch (error: any) {
    console.error("[PATCH /api/events/[id]] Error:", error);
    return serverErrorResponse(error?.message || "Internal server error");
  }
}
