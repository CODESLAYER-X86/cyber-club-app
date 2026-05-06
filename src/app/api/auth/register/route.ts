import { db } from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, studentId, department, phone, transactionId } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return errorResponse("Full name is required");
    }
    if (!email || !email.trim()) {
      return errorResponse("Email is required");
    }
    if (!password || !password.trim()) {
      return errorResponse("Password is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse("Invalid email format");
    }

    // Validate password length
    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters");
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return errorResponse("An account with this email already exists");
    }

    // Check if student ID already exists (if provided)
    if (studentId && studentId.trim()) {
      const existingStudent = await db.user.findFirst({
        where: { studentId: studentId.trim() },
      });
      if (existingStudent) {
        return errorResponse("A student with this ID already exists");
      }
    }

    // Create user with MEMBER role and PENDING membership status
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password, // Simple plaintext as per the existing auth approach
        studentId: studentId?.trim() || null,
        department: department?.trim() || null,
        phone: phone?.trim() || null,
        transactionId: transactionId?.trim() || null,
        role: "MEMBER",
        membershipStatus: "PENDING",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        membershipStatus: true,
        studentId: true,
        department: true,
        phone: true,
        createdAt: true,
      },
    });

    // Create a notification for admins about new registration
    const admins = await db.user.findMany({
      where: {
        role: { in: ["PRESIDENT", "GS", "PLATFORM_ADMIN"] },
      },
      select: { id: true },
    });

    await db.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: "New Member Registration",
        message: `${name.trim()} has registered and is awaiting approval.`,
        type: "INFO",
      })),
    });

    return successResponse({ user }, 201);
  } catch {
    return serverErrorResponse();
  }
}
