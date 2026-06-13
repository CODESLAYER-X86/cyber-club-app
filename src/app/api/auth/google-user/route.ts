import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

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
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser();

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

  return NextResponse.json({ success: true, data: { user: dbUser } });
}
