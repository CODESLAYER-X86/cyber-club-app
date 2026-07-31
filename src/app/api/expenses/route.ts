import prisma from "@/lib/db";
import { successResponse, errorResponse, serverErrorResponse, forbiddenResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("You must be logged in to view expenses");
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        items: {
          orderBy: { id: "asc" },
        },
        presidentApprover: {
          select: { id: true, name: true },
        },
        gsApprover: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ expenses });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const caller = await getSupabaseUser(["TREASURER", "PLATFORM_ADMIN"]);
    if (!caller) {
      return forbiddenResponse("Only the Treasurer or Platform Admin can submit expenses");
    }

    const body = await request.json();
    const { title, date, purchasedBy, attachmentUrl, items } = body;

    if (!title || !items || !Array.isArray(items) || items.length === 0) {
      return errorResponse("Title and at least one item are required");
    }

    // Validate each item
    for (const item of items) {
      if (!item.itemName || !item.price || item.price <= 0) {
        return errorResponse("Each item must have a name and positive price");
      }
      if (!item.quantity || item.quantity <= 0) {
        return errorResponse("Each item must have a positive quantity");
      }
    }

    // Calculate total amount from items
    const totalAmount = items.reduce((sum: number, item: { quantity: number; price: number }) => sum + item.quantity * item.price, 0);

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: totalAmount,
        date: date ? new Date(date) : new Date(),
        purchasedBy: purchasedBy || null,
        attachmentUrl: attachmentUrl || null,
        createdBy: caller.userId,
        status: "PENDING",
        presidentStatus: "PENDING",
        gsStatus: "PENDING",
        items: {
          create: items.map((item: { itemName: string; quantity: number; unit: string; price: number }) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit || "pcs",
            price: item.price,
          })),
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        items: true,
      },
    });

    return successResponse({ expense }, 201);
  } catch (e) {
    console.error("[Expense Create API] Error:", e);
    return serverErrorResponse();
  }
}
