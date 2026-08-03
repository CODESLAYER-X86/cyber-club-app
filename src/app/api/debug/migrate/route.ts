import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// One-time migration endpoint to create missing tables.
// After the TreasuryDeposit table is created, this endpoint can be removed.
export async function POST() {
  const results: Record<string, unknown> = {};

  // Check if TreasuryDeposit table exists
  try {
    const check = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*) as count FROM pg_tables WHERE schemaname = 'public' AND tablename = 'TreasuryDeposit'
    `;
    const exists = Number(check[0].count) > 0;
    results.treasuryDepositExists = exists;

    if (!exists) {
      // Create the TreasuryDeposit table matching the Prisma schema exactly
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "TreasuryDeposit" (
          "id" TEXT NOT NULL,
          "date" TIMESTAMP(3) NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "source" TEXT NOT NULL,
          "note" TEXT,
          "attachmentUrl" TEXT,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "presidentStatus" TEXT NOT NULL DEFAULT 'PENDING',
          "gsStatus" TEXT NOT NULL DEFAULT 'PENDING',
          "submittedBy" TEXT NOT NULL,
          "presidentApprovedBy" TEXT,
          "gsApprovedBy" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "TreasuryDeposit_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "TreasuryDeposit_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "TreasuryDeposit_presidentApprovedBy_fkey" FOREIGN KEY ("presidentApprovedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          CONSTRAINT "TreasuryDeposit_gsApprovedBy_fkey" FOREIGN KEY ("gsApprovedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
      `);

      // Create indexes matching the schema
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "TreasuryDeposit_status_idx" ON "TreasuryDeposit"("status")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "TreasuryDeposit_submittedBy_idx" ON "TreasuryDeposit"("submittedBy")
      `);

      results.treasuryDepositCreated = true;
    } else {
      results.treasuryDepositCreated = false;
      results.message = 'Table already exists, no action needed';
    }
  } catch (e: unknown) {
    results.treasuryDepositError = e instanceof Error ? e.message : String(e);
  }

  // Verify the table works now
  try {
    const count = await prisma.treasuryDeposit.count();
    results.treasuryDepositVerification = `OK (${count} rows)`;
  } catch (e: unknown) {
    results.treasuryDepositVerification = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({ success: true, data: results }, { status: 200 });
}
