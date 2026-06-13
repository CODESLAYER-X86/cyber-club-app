import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isPlatformAdminEmail } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * Server-side session guard using Supabase cookies.
 * Replaces the NextAuth requireSession() which is dead code in this app.
 *
 * Returns { userId, role } for the currently signed-in user,
 * or null if unauthenticated or if the role is not in allowedRoles.
 */
export async function getSupabaseUser(allowedRoles?: string[]): Promise<{
  userId: string;
  email: string;
  role: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) return null;

    // Platform admin is always env-controlled
    if (isPlatformAdminEmail(user.email)) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      });
      if (!dbUser) return null;
      if (allowedRoles && !allowedRoles.includes("PLATFORM_ADMIN")) return null;
      return { userId: dbUser.id, email: user.email, role: "PLATFORM_ADMIN" };
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, role: true },
    });

    if (!dbUser) return null;
    if (allowedRoles && !allowedRoles.includes(dbUser.role)) return null;

    return { userId: dbUser.id, email: user.email, role: dbUser.role };
  } catch {
    return null;
  }
}
