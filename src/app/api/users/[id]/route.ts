import { db } from "@/lib/db";
import { successResponse, notFoundResponse, errorResponse, serverErrorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
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

    const user = await db.user.findUnique({ where: { id } });
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

    const updatedUser = await db.user.update({
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
