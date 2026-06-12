import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import prisma from "@/lib/db";

// Custom error so NextAuth v5 surfaces it to the client as error.code
class PendingApprovalError extends CredentialsSignin {
  code = "pending_approval";
}

class RejectedError extends CredentialsSignin {
  code = "account_rejected";
}

// Helper: check if an email is a Platform Admin (env-controlled — never from DB alone)
export function isPlatformAdminEmail(email: string): boolean {
  const envVal = process.env.PLATFORM_ADMIN_EMAIL;
  if (!envVal) return false;
  return envVal
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase().trim());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          console.warn(`[SECURITY] Failed login: ${email} (not found)`);
          return null;
        }

        // Block rejected members
        if (user.membershipStatus === "REJECTED") {
          throw new RejectedError();
        }

        const passwordMatch = await bcryptjs.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          console.warn(`[SECURITY] Failed login: ${email} (wrong password)`);
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          membershipStatus: user.membershipStatus,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On first sign-in, populate token from DB user
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role ?? "MEMBER";
        token.membershipStatus = (user as unknown as { membershipStatus: string }).membershipStatus ?? "PENDING";
        token.lastRefresh = Date.now();
      }

      // SECURITY: Never accept role/membershipStatus updates from the client session
      // Only allow safe fields (e.g., name) in trigger=update
      if (trigger === "update" && session !== null) {
        // Intentionally ignored — role changes are picked up via DB refresh below
      }

      // Refresh role + membershipStatus from DB every 60s
      // This ensures role changes, approvals, and bans take effect immediately
      const REFRESH_INTERVAL = 60 * 1000;
      const now = Date.now();
      if (
        token.id &&
        (!token.lastRefresh || now - (token.lastRefresh as number) >= REFRESH_INTERVAL)
      ) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, membershipStatus: true, email: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.membershipStatus = dbUser.membershipStatus;

            // STRICT ENFORCEMENT: Platform Admin role is env-controlled
            // If email is in PLATFORM_ADMIN_EMAIL, enforce role = PLATFORM_ADMIN in token
            if (isPlatformAdminEmail(dbUser.email) && token.role !== "PLATFORM_ADMIN") {
              token.role = "PLATFORM_ADMIN";
              await prisma.user.update({
                where: { id: token.id as string },
                data: { role: "PLATFORM_ADMIN" },
              });
            }
            // Auto-revoke: if email removed from env var, demote to MEMBER
            else if (!isPlatformAdminEmail(dbUser.email) && token.role === "PLATFORM_ADMIN") {
              token.role = "MEMBER";
              await prisma.user.update({
                where: { id: token.id as string },
                data: { role: "MEMBER" },
              });
            }
          }
          token.lastRefresh = now;
        } catch {
          // If DB is unreachable, keep existing values — do not lock out the user
        }
      }

      // STRICT ENFORCEMENT: Every request, re-validate PLATFORM_ADMIN status
      // This ensures immediate revocation if email is removed from env var
      const tokenEmail = token.email as string || "";
      if (token.role === "PLATFORM_ADMIN" && !isPlatformAdminEmail(tokenEmail)) {
        token.role = "MEMBER";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { membershipStatus: string }).membershipStatus =
          token.membershipStatus as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },
});

/**
 * Server-side session guard for API routes.
 * Always reads role from the DB-refreshed JWT — never trusts client input.
 *
 * @example
 * const session = await requireSession(allowedRoles: ["PRESIDENT", "GS"])
 */
export async function requireSession(allowedRoles?: string[]) {
  const session = await auth();
  if (!session?.user) {
    return { session: null, error: "UNAUTHORIZED" } as const;
  }
  const role = (session.user as { role: string }).role;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return { session: null, error: "FORBIDDEN" } as const;
  }
  return { session, error: null } as const;
}
