import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { getSupabaseUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["PRESIDENT", "VP", "GS", "TREASURER", "PLATFORM_ADMIN"];

function isValidBearerToken(authHeader: string | null, secret: string | undefined): boolean {
  if (!authHeader || !secret) return false;
  if (!authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7).trim();
  if (!token || token.length !== secret.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token, "utf8"), Buffer.from(secret, "utf8"));
  } catch {
    return false;
  }
}

function escapeCSV(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const secret = process.env.SHEETS_SYNC_SECRET;

    // 1. Check Bearer Token (for automated Google Apps Script / Cron)
    const hasValidToken = isValidBearerToken(authHeader, secret);

    // 2. Check Session Cookie (for in-browser executive direct access)
    let hasValidSession = false;
    let caller: { userId: string; email: string; role: string } | null = null;
    if (!hasValidToken) {
      caller = await getSupabaseUser(ALLOWED_ROLES);
      if (caller) {
        hasValidSession = true;
      }
    }

    if (!hasValidToken && !hasValidSession) {
      return NextResponse.json(
        { error: "Unauthorized. Valid Bearer token or authorized executive session required." },
        { status: 401 }
      );
    }

    // 3. Query members with academic info and verified certificates
    const users = await prisma.user.findMany({
      select: {
        name: true,
        studentId: true,
        email: true,
        phone: true,
        department: true,
        batch: true,
        rollNumber: true,
        role: true,
        membershipStatus: true,
        createdAt: true,
        certificates: {
          where: {
            status: { not: "REVOKED" },
          },
          select: {
            certificateCode: true,
            type: true,
          },
          orderBy: {
            issuedAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://cybersecdiu.club";

    const headers = [
      "Full Name",
      "Student ID",
      "University Email",
      "Phone Number",
      "Department",
      "Batch",
      "Roll Number",
      "Club Role",
      "Membership Status",
      "Joined Date",
      "Certificates Count",
      "Certificate Codes",
      "Verification URLs",
    ];

    const rows = users.map((u) => {
      const certCodes = u.certificates.map((c) => c.certificateCode).join(", ");
      const certUrls = u.certificates
        .map((c) => `${baseUrl}/verify/${c.certificateCode}`)
        .join(", ");

      return [
        u.name,
        u.studentId || "N/A",
        u.email,
        u.phone || "N/A",
        u.department || "N/A",
        u.batch || "N/A",
        u.rollNumber || "N/A",
        u.role,
        u.membershipStatus,
        new Date(u.createdAt).toISOString().slice(0, 10),
        u.certificates.length.toString(),
        certCodes || "None",
        certUrls || "None",
      ];
    });

    // Check if CSV format is explicitly requested
    const { searchParams } = new URL(request.url);
    if (caller) {
      try {
        const format = searchParams.get("format") || "json";
        await prisma.auditLog.create({
          data: {
            userId: caller.userId,
            action: "DATA_EXPORTED",
            details: `Exported member sync data via Google Sheets feed (${format.toUpperCase()})`,
          },
        });
      } catch (auditErr) {
        console.error("Audit log error on sheets sync:", auditErr);
      }
    }

    if (searchParams.get("format") === "csv") {
      const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map((row) => row.map(escapeCSV).join(",")),
      ].join("\n");

      return new Response(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="members-sync-${new Date().toISOString().slice(0, 10)}.csv"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // Default: structured JSON for Google Apps Script
    return NextResponse.json(
      {
        success: true,
        headers,
        rows,
        totalCount: users.length,
        syncedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[GOOGLE_SHEETS_FEED_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error during data generation" },
      { status: 500 }
    );
  }
}
