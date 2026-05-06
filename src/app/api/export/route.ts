import { db } from "@/lib/db";
import { errorResponse, forbiddenResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

const ALLOWED_ROLES = ["PRESIDENT", "TREASURER", "PLATFORM_ADMIN"];

function escapeCSV(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(headers: string[], rows: string[][]): string {
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const userId = searchParams.get("userId");

    if (!type || !["members", "events", "payments", "certificates"].includes(type)) {
      return errorResponse("Invalid export type. Must be one of: members, events, payments, certificates");
    }

    // RBAC check
    if (!userId) {
      return forbiddenResponse("User ID is required for export");
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || !ALLOWED_ROLES.includes(user.role)) {
      return forbiddenResponse("Only President, Treasurer, and Platform Admin can export data");
    }

    let csv: string;
    let filename: string;

    switch (type) {
      case "members": {
        const members = await db.user.findMany({
          select: {
            name: true,
            email: true,
            role: true,
            department: true,
            membershipStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = ["Name", "Email", "Role", "Department", "Membership Status", "Created At"];
        const rows = members.map(m => [
          escapeCSV(m.name),
          escapeCSV(m.email),
          escapeCSV(m.role),
          escapeCSV(m.department || "N/A"),
          escapeCSV(m.membershipStatus),
          escapeCSV(new Date(m.createdAt).toLocaleDateString()),
        ]);

        csv = toCSV(headers, rows);
        filename = `members-export-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "events": {
        const events = await db.event.findMany({
          select: {
            title: true,
            category: true,
            status: true,
            venue: true,
            startDate: true,
            fee: true,
            maxSeats: true,
            currentSeats: true,
          },
          orderBy: { startDate: "desc" },
        });

        const headers = ["Title", "Category", "Status", "Venue", "Start Date", "Fee", "Max Seats", "Current Seats"];
        const rows = events.map(e => [
          escapeCSV(e.title),
          escapeCSV(e.category),
          escapeCSV(e.status),
          escapeCSV(e.venue),
          escapeCSV(new Date(e.startDate).toLocaleDateString()),
          escapeCSV(e.fee > 0 ? e.fee.toString() : "Free"),
          escapeCSV(e.maxSeats?.toString() || "Unlimited"),
          escapeCSV(e.currentSeats.toString()),
        ]);

        csv = toCSV(headers, rows);
        filename = `events-export-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "payments": {
        const payments = await db.payment.findMany({
          select: {
            user: { select: { name: true } },
            amount: true,
            type: true,
            status: true,
            transactionId: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = ["User Name", "Amount", "Type", "Status", "Transaction ID", "Created At"];
        const rows = payments.map(p => [
          escapeCSV(p.user?.name || "Unknown"),
          escapeCSV(p.amount.toString()),
          escapeCSV(p.type),
          escapeCSV(p.status),
          escapeCSV(p.transactionId),
          escapeCSV(new Date(p.createdAt).toLocaleDateString()),
        ]);

        csv = toCSV(headers, rows);
        filename = `payments-export-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "certificates": {
        const certificates = await db.certificate.findMany({
          select: {
            user: { select: { name: true } },
            event: { select: { title: true } },
            type: true,
            status: true,
            certificateCode: true,
            score: true,
            issuedAt: true,
          },
          orderBy: { issuedAt: "desc" },
        });

        const headers = ["User Name", "Event Title", "Type", "Status", "Certificate Code", "Score", "Issued At"];
        const rows = certificates.map(c => [
          escapeCSV(c.user?.name || "Unknown"),
          escapeCSV(c.event?.title || "Unknown"),
          escapeCSV(c.type),
          escapeCSV(c.status),
          escapeCSV(c.certificateCode),
          escapeCSV(c.score !== null ? c.score.toString() : "N/A"),
          escapeCSV(new Date(c.issuedAt).toLocaleDateString()),
        ]);

        csv = toCSV(headers, rows);
        filename = `certificates-export-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      default:
        return errorResponse("Invalid export type");
    }

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return serverErrorResponse();
  }
}
