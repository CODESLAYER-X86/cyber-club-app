import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Diagnostic endpoint — tests database connectivity and model availability.
// Remove or protect with admin auth before going to production.
export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Test basic connection
  try {
    await prisma.$queryRaw`SELECT 1 as ok`;
    results.connection = 'OK';
  } catch (e: unknown) {
    results.connection = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 2. List all tables in the public schema
  try {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `;
    results.tables = tables.map((t) => t.tablename);
  } catch (e: unknown) {
    results.tables = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 3. Test User model
  try {
    const count = await prisma.user.count();
    results.userCount = count;
  } catch (e: unknown) {
    results.userCount = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 4. Test TreasuryDeposit model
  try {
    const count = await prisma.treasuryDeposit.count();
    results.treasuryDepositCount = count;
  } catch (e: unknown) {
    results.treasuryDepositCount = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 5. Test Expense model
  try {
    const count = await prisma.expense.count();
    results.expenseCount = count;
  } catch (e: unknown) {
    results.expenseCount = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 6. Test findMany on TreasuryDeposit (the actual query the deposits page uses)
  try {
    const deposits = await prisma.treasuryDeposit.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        submitter: { select: { id: true, name: true, email: true, role: true } },
        presidentApprover: { select: { id: true, name: true, email: true, role: true } },
        gsApprover: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    results.depositsFindMany = `OK (${deposits.length} records)`;
  } catch (e: unknown) {
    results.depositsFindMany = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 7. Test create on TreasuryDeposit (dry run — we won't actually insert)
  try {
    // Just validate the model is accessible by attempting a count with a where clause
    const pending = await prisma.treasuryDeposit.count({ where: { status: 'PENDING' } });
    results.depositsCreateReady = `OK (${pending} pending deposits)`;
  } catch (e: unknown) {
    results.depositsCreateReady = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 8. Environment check (non-sensitive)
  results.env = {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DIRECT_URL_set: !!process.env.DIRECT_URL,
    NEXT_PUBLIC_SUPABASE_URL_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json({ success: true, data: results }, { status: 200 });
}
