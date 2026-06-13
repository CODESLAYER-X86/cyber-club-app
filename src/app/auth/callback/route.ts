import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

/**
 * Supabase Google OAuth callback.
 * Flow: Google → Supabase → here → upsert Prisma user → redirect to /?google_auth=1
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=google_no_code`);
  }

  const cookieStore = await cookies();

  // Create the redirect response FIRST so we can write cookies onto it.
  // In App Router GET handlers, cookies() is read-only — we must write to
  // the NextResponse object instead.
  const successResponse = NextResponse.redirect(`${origin}/?google_auth=1`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            successResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !session) {
    console.error('[Google OAuth] exchangeCodeForSession error:', error?.message);
    return NextResponse.redirect(`${origin}/?error=google_auth_failed`);
  }

  const { user } = session;
  const email = user.email;
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    email?.split('@')[0] ||
    'User';
  const avatar =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  if (!email) {
    return NextResponse.redirect(`${origin}/?error=google_no_email`);
  }

  try {
    // Find or create the user in our Prisma DB
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          name,
          password: '', // Google users have no password — empty string never matches bcrypt
          avatar,
          role: 'GUEST',
          membershipStatus: 'NON_MEMBER',
        },
      });
    }
    // If user exists, just let them sign in — their existing role/status is preserved
  } catch (e) {
    console.error('[Google OAuth] DB upsert error:', e);
    // Non-fatal: user may already exist — continue to redirect
  }

  // Return the pre-built response — session cookies are already attached to it
  return successResponse;
}
