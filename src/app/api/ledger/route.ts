import prisma from "@/lib/db";
import { successResponse, serverErrorResponse, forbiddenResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const caller = await getSupabaseUser();
    if (!caller) {
      return forbiddenResponse("You must be logged in to view the ledger");
    }

    // Fetch all entries sorted by date
    const ledgerEntries = await prisma.ledgerEntry.findMany({
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate balances for each wallet type
    const walletBalances = {
      BKASH_PERSONAL: 0,
      NAGAD_PERSONAL: 0,
      CLUB_BANK_ACCOUNT: 0,
      CASH_IN_HAND: 0,
    };

    ledgerEntries.forEach((entry) => {
      const amt = entry.amount;
      const w = entry.wallet as keyof typeof walletBalances;
      if (w in walletBalances) {
        if (entry.type === "CREDIT") {
          walletBalances[w] += amt;
        } else if (entry.type === "DEBIT") {
          walletBalances[w] -= amt;
        }
      }
    });

    return successResponse({ ledgerEntries, walletBalances });
  } catch (e) {
    console.error("[Ledger GET API] Error:", e);
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const caller = await getSupabaseUser(["TREASURER", "PRESIDENT", "PLATFORM_ADMIN"]);
    if (!caller) {
      return forbiddenResponse("Only the Treasurer, President, or Platform Admin can manually post ledger entries");
    }

    const body = await request.json();
    const { type, amount, wallet, description } = body;

    if (!type || !["CREDIT", "DEBIT"].includes(type)) {
      return errorResponse("Invalid ledger entry type. Must be 'CREDIT' or 'DEBIT'");
    }

    if (!amount || amount <= 0) {
      return errorResponse("Amount must be a positive number");
    }

    const VALID_WALLETS = ["BKASH_PERSONAL", "NAGAD_PERSONAL", "CLUB_BANK_ACCOUNT", "CASH_IN_HAND"];
    if (!wallet || !VALID_WALLETS.includes(wallet)) {
      return errorResponse(`Invalid wallet. Must be one of: ${VALID_WALLETS.join(", ")}`);
    }

    if (!description || description.trim().length === 0) {
      return errorResponse("Description is required");
    }

    const ledgerEntry = await prisma.ledgerEntry.create({
      data: {
        type,
        amount,
        wallet,
        description: description.trim(),
        performedBy: caller.userId,
      },
      include: {
        operator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return successResponse({ ledgerEntry }, 201);
  } catch (e) {
    console.error("[Ledger POST API] Error:", e);
    return serverErrorResponse();
  }
}

function errorResponse(msg: string) {
  return new Response(JSON.stringify({ success: false, error: msg }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
