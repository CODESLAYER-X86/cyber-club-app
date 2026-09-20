import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isPlatformAdminEmail } from '@/lib/auth';

/**
 * GET /api/auth/google-user
 * Called by the SPA after a Google OAuth redirect (page.tsx detects ?google_auth=1).
 * Reads the Supabase session from cookies → finds the Prisma user → returns full user object.
 */
export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );

  const { data: { session }, error } = await supabase.auth.getSession();
  const user = session?.user;

  if (error || !user?.email) {
    return NextResponse.json({ success: false, error: 'No active Google session' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      membershipStatus: true,
      avatar: true,
      studentId: true,
      rollNumber: true,
      batch: true,
      department: true,
      phone: true,
      bio: true,
      transactionId: true,
      paymentProof: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json({ success: false, error: 'User not found in database' }, { status: 404 });
  }

  // Enforce platform admin role in real-time (env-controlled, never stale)
  const resolvedRole = isPlatformAdminEmail(dbUser.email)
    ? 'PLATFORM_ADMIN'
    : dbUser.role === 'PLATFORM_ADMIN'
    ? 'MEMBER' // demote if email removed from env
    : dbUser.role;

  // Auto-sync: Any non-GUEST role (PRESIDENT, VP, GS, MEMBER, etc.) must have ACTIVE membership status
  const resolvedMembershipStatus =
    resolvedRole === 'GUEST' ? dbUser.membershipStatus : 'ACTIVE';

  const updateData: Record<string, string> = {};
  if (resolvedRole !== dbUser.role) updateData.role = resolvedRole;
  if (resolvedMembershipStatus !== dbUser.membershipStatus) updateData.membershipStatus = resolvedMembershipStatus;

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({ where: { id: dbUser.id }, data: updateData });
  }

  return NextResponse.json({
    success: true,
    data: {
      user: {
        ...dbUser,
        role: resolvedRole,
        membershipStatus: resolvedMembershipStatus,
      },
    },
  });
}
