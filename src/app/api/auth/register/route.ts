import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, studentId, department, phone, transactionId } = body;

    if (!name?.trim()) return errorResponse("Full name is required");
    if (!email?.trim()) return errorResponse("Email is required");
    if (!password?.trim()) return errorResponse("Password is required");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return errorResponse("Invalid email format");

    // Strong password validation — mirrors meal-app production
    if (password.length < 8) return errorResponse("Password must be at least 8 characters");
    if (!/[A-Z]/.test(password)) return errorResponse("Password must contain an uppercase letter");
    if (!/[a-z]/.test(password)) return errorResponse("Password must contain a lowercase letter");
    if (!/[0-9]/.test(password)) return errorResponse("Password must contain a number");

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) return errorResponse("An account with this email already exists");

    if (studentId?.trim()) {
      const existingStudent = await prisma.user.findFirst({ where: { studentId: studentId.trim() } });
      if (existingStudent) return errorResponse("A student with this ID already exists");
    }

    // Hash with cost factor 12 — same as meal-app production
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        studentId: studentId?.trim() || null,
        department: department?.trim() || null,
        phone: phone?.trim() || null,
        transactionId: transactionId?.trim() || null,
        role: "MEMBER",
        membershipStatus: "PENDING",
      },
      select: {
        id: true, email: true, name: true, role: true,
        membershipStatus: true, studentId: true, department: true,
        phone: true, createdAt: true,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ["PRESIDENT", "GS", "PLATFORM_ADMIN"] } },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "New Member Registration",
          message: `${name.trim()} has registered and is awaiting approval.`,
          type: "INFO",
        })),
      });
    }

    return successResponse({ user }, 201);
  } catch {
    return serverErrorResponse();
  }
}
