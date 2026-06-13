import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

// Note: This route is used only for SPA client-side login.
// After verifying credentials, the client calls NextAuth signIn("credentials", ...)
// which handles session creation. This route just validates credentials up-front.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email and password are required");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return errorResponse("Invalid email or password", 401);
    }

    if (user.membershipStatus === "REJECTED") {
      return errorResponse("Your account has been rejected. Contact an admin.", 403);
    }

    if (!user.password) {
      return errorResponse("Please sign in using Google", 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.warn(`[SECURITY] Failed login: ${email} (wrong password)`);
      return errorResponse("Invalid email or password", 401);
    }

    const { password: _, ...userWithoutPassword } = user;
    return successResponse({ user: userWithoutPassword });
  } catch {
    return serverErrorResponse();
  }
}
