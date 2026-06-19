import prisma from "@/lib/db";
import { successResponse, notFoundResponse, errorResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        membershipStatus: true,
        avatar: true,
        studentId: true,
        department: true,
        phone: true,
        bio: true,
        transactionId: true,
        paymentProof: true,
        createdAt: true,
        updatedAt: true,
        eventRegistrations: {
          include: { event: true },
          orderBy: { registeredAt: "desc" },
        },
        certificates: {
          include: { event: true },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return notFoundResponse("User not found");
    }

    return successResponse({ user });
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

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return notFoundResponse("User not found");
    }

    const body = await request.json();
    const { name, phone, bio } = body;

    // Only allow updating specific profile fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No valid fields to update");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        membershipStatus: true,
        avatar: true,
        studentId: true,
        department: true,
        phone: true,
        bio: true,
        transactionId: true,
        paymentProof: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse({ user: updatedUser });
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

    // Authenticate the requester (must be PRESIDENT, GS, or PLATFORM_ADMIN)
    const updater = await getSupabaseUser(["PRESIDENT", "GS", "PLATFORM_ADMIN"]);
    if (!updater) {
      return forbiddenResponse("Only PRESIDENT, GENERAL SECRETARY, and PLATFORM_ADMIN can kick members");
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return notFoundResponse("User not found");
    }

    // Protection rules:
    // 1. Cannot kick a platform admin
    if (targetUser.role === "PLATFORM_ADMIN" || targetUser.email === "admin@csc.com") {
      return forbiddenResponse("Platform Admins cannot be kicked");
    }

    // 2. Cannot kick self
    if (targetUser.id === updater.userId) {
      return forbiddenResponse("You cannot kick yourself");
    }

    // 3. GS cannot kick the President
    if (targetUser.role === "PRESIDENT" && updater.role === "GS") {
      return forbiddenResponse("General Secretary cannot kick the President");
    }

    // Check if user has created events, budgets, expenses, verified payments, approved expenses, issued/approved/revoked certificates, or approved achievements
    const [
      eventsCreated,
      budgetsCreated,
      expensesCreated,
      paymentsVerified,
      expensesApproved,
      certificatesIssued,
      certificatesApproved,
      certificatesRevoked,
      achievementsApproved,
    ] = await Promise.all([
      prisma.event.count({ where: { createdBy: id } }),
      prisma.budget.count({ where: { createdBy: id } }),
      prisma.expense.count({ where: { createdBy: id } }),
      prisma.payment.count({ where: { verifiedBy: id } }),
      prisma.expense.count({ where: { approvedBy: id } }),
      prisma.certificate.count({ where: { issuedBy: id } }),
      prisma.certificate.count({ where: { approvedBy: id } }),
      prisma.certificate.count({ where: { revokedBy: id } }),
      prisma.achievement.count({ where: { approvedBy: id } }),
    ]);

    const hasCreatedHistory =
      eventsCreated > 0 ||
      budgetsCreated > 0 ||
      expensesCreated > 0 ||
      paymentsVerified > 0 ||
      expensesApproved > 0 ||
      certificatesIssued > 0 ||
      certificatesApproved > 0 ||
      certificatesRevoked > 0 ||
      achievementsApproved > 0;

    if (hasCreatedHistory) {
      // Anonymize user to preserve database foreign key integrity
      await prisma.$transaction([
        prisma.notification.deleteMany({ where: { userId: id } }),
        prisma.eventRegistration.deleteMany({ where: { userId: id } }),
        prisma.attendance.deleteMany({ where: { userId: id } }),
        prisma.assessmentSubmission.deleteMany({ where: { userId: id } }),
        prisma.certificateAuditLog.deleteMany({ where: { certificate: { userId: id } } }),
        prisma.certificate.deleteMany({ where: { userId: id } }),
        prisma.payment.deleteMany({ where: { userId: id } }),
        prisma.galleryImage.deleteMany({ where: { uploadedBy: id } }),
        prisma.user.update({
          where: { id },
          data: {
            name: "Kicked Member",
            email: `kicked-${id.substring(0, 8)}@csc-kicked.com`, // scrambled email prevents login
            password: null,
            avatar: null,
            studentId: null,
            department: null,
            phone: null,
            bio: null,
            transactionId: null,
            paymentProof: null,
            role: "GUEST",
            membershipStatus: "NON_MEMBER",
          },
        }),
      ]);
    } else {
      // Fully delete user and all related records from DB
      await prisma.$transaction([
        prisma.notification.deleteMany({ where: { userId: id } }),
        prisma.eventRegistration.deleteMany({ where: { userId: id } }),
        prisma.attendance.deleteMany({ where: { userId: id } }),
        prisma.assessmentSubmission.deleteMany({ where: { userId: id } }),
        prisma.certificateAuditLog.deleteMany({ where: { certificate: { userId: id } } }),
        prisma.certificate.deleteMany({ where: { userId: id } }),
        prisma.payment.deleteMany({ where: { userId: id } }),
        prisma.galleryImage.deleteMany({ where: { uploadedBy: id } }),
        prisma.achievement.deleteMany({ where: { submittedBy: id } }),
        prisma.auditLog.deleteMany({ where: { userId: id } }),
        prisma.user.delete({ where: { id } }),
      ]);
    }

    // Log in audit log
    await prisma.auditLog.create({
      data: {
        userId: updater.userId,
        action: "MEMBER_KICKED",
        details: `Permanently kicked and deleted user ${targetUser.name} (${targetUser.email}). ${
          hasCreatedHistory ? "Anonymized profile to preserve created events/budgets/records." : "Fully deleted user row."
        }`,
      },
    });

    return successResponse({ success: true, message: "Member fully kicked and deleted successfully" });
  } catch (error) {
    console.error("Kick member error:", error);
    return serverErrorResponse();
  }
}
