import prisma from "@/lib/db";
import { successResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("Please sign in to access the payment tracker");
    }

    const ALLOWED_ROLES = ["PRESIDENT", "VP", "GS", "TREASURER", "PLATFORM_ADMIN", "VERIFIER"];
    if (!ALLOWED_ROLES.includes(caller.role)) {
      return forbiddenResponse("You do not have permission to view the payment tracker");
    }

    const isVerifierOnly = caller.role === "VERIFIER";

    // 1. Fetch Membership Payments (Financial Leadership & Executive only)
    const membershipPayments = isVerifierOnly
      ? []
      : await prisma.payment.findMany({
          where: { type: "MEMBERSHIP" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                studentId: true,
                rollNumber: true,
                batch: true,
                department: true,
                phone: true,
                gender: true,
                sentToNumber: true,
                membershipStatus: true,
              },
            },
            verifier: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

    // 2. Fetch Events with their registrations and payment rosters
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        type: true,
        startDate: true,
        endDate: true,
        venue: true,
        fee: true,
        currentSeats: true,
        maxSeats: true,
        status: true,
        verifierId: true,
        createdAt: true,
        registrations: {
          select: {
            id: true,
            status: true,
            preferredName: true,
            studentId: true,
            department: true,
            institution: true,
            registeredAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                phone: true,
                studentId: true,
                rollNumber: true,
                batch: true,
                department: true,
                gender: true,
              },
            },
          },
          orderBy: { registeredAt: "desc" },
        },
        payments: {
          where: { type: "EVENT" },
          select: {
            id: true,
            userId: true,
            amount: true,
            status: true,
            transactionId: true,
            paymentMethod: true,
            receiverName: true,
            sentToNumber: true,
            proofUrl: true,
            createdAt: true,
            verifier: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    // Combine event registrations with their respective payment records
    const processedEvents = events.map((event) => {
      const paymentsByUserId = new Map(event.payments.map((p) => [p.userId, p]));
      
      const registrationsWithPayment = event.registrations.map((reg) => {
        const payment = paymentsByUserId.get(reg.user.id) || null;
        return {
          ...reg,
          payment,
        };
      });

      const verifiedRevenue = event.payments
        .filter((p) => ["VERIFIED", "APPROVED"].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0);

      const pendingRevenue = event.payments
        .filter((p) => p.status === "PENDING")
        .reduce((sum, p) => sum + p.amount, 0);

      const paidCount = event.payments.filter((p) =>
        ["VERIFIED", "APPROVED"].includes(p.status)
      ).length;

      const pendingCount = event.payments.filter((p) => p.status === "PENDING").length;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        type: event.type,
        startDate: event.startDate,
        endDate: event.endDate,
        venue: event.venue,
        fee: event.fee,
        currentSeats: event.currentSeats,
        maxSeats: event.maxSeats,
        status: event.status,
        verifierId: event.verifierId,
        totalCollected: verifiedRevenue,
        pendingCollected: pendingRevenue,
        registrationsCount: event.registrations.length,
        paidCount,
        pendingCount,
        registrations: registrationsWithPayment,
      };
    });

    // 3. Compute Receivers Summary (Who holds what money)
    const allPayments = await prisma.payment.findMany({
      select: {
        id: true,
        amount: true,
        status: true,
        type: true,
        paymentMethod: true,
        receiverName: true,
        sentToNumber: true,
      },
    });

    const receiverMap = new Map<
      string,
      {
        receiverKey: string;
        receiverName: string;
        sentToNumber: string;
        totalAmount: number;
        verifiedAmount: number;
        pendingAmount: number;
        totalTransactions: number;
      }
    >();

    for (const p of allPayments) {
      const receiverName = p.receiverName?.trim() || "Unspecified Receiver";
      const sentToNumber = p.sentToNumber?.trim() || (p.paymentMethod === "CASH" ? "Campus Cash Desk" : "Club Official MFS");
      const key = `${receiverName}::${sentToNumber}`;

      if (!receiverMap.has(key)) {
        receiverMap.set(key, {
          receiverKey: key,
          receiverName,
          sentToNumber,
          totalAmount: 0,
          verifiedAmount: 0,
          pendingAmount: 0,
          totalTransactions: 0,
        });
      }

      const entry = receiverMap.get(key)!;
      entry.totalTransactions += 1;
      entry.totalAmount += p.amount;
      if (["VERIFIED", "APPROVED"].includes(p.status)) {
        entry.verifiedAmount += p.amount;
      } else if (p.status === "PENDING") {
        entry.pendingAmount += p.amount;
      }
    }

    const receiversSummary = Array.from(receiverMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    // 4. Global KPI Aggregates
    const verifiedPayments = allPayments.filter((p) => ["VERIFIED", "APPROVED"].includes(p.status));
    const pendingPayments = allPayments.filter((p) => p.status === "PENDING");

    const totalVerifiedAmount = verifiedPayments.reduce((s, p) => s + p.amount, 0);
    const totalPendingAmount = pendingPayments.reduce((s, p) => s + p.amount, 0);

    const membershipVerifiedAmount = verifiedPayments
      .filter((p) => p.type === "MEMBERSHIP")
      .reduce((s, p) => s + p.amount, 0);

    const eventVerifiedAmount = verifiedPayments
      .filter((p) => p.type === "EVENT")
      .reduce((s, p) => s + p.amount, 0);

    return successResponse({
      summary: {
        totalVerifiedAmount,
        totalPendingAmount,
        totalPendingCount: pendingPayments.length,
        membershipVerifiedAmount,
        membershipTotalCount: membershipPayments.length,
        eventVerifiedAmount,
        eventsCount: events.length,
      },
      membershipPayments,
      events: processedEvents,
      receiversSummary,
    });
  } catch (error) {
    console.error("[Payment Tracker API] Error:", error);
    return serverErrorResponse();
  }
}
