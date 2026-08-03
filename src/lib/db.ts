import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('[db] FATAL: Neither DIRECT_URL nor DATABASE_URL is set.');
    throw new Error("Database connection is not configured. Set DIRECT_URL or DATABASE_URL.");
  }

  // Use PrismaClient directly — works on Vercel serverless, Vercel Postgres,
  // Supabase, and any standard PostgreSQL. The pg Pool adapter is NOT compatible
  // with serverless runtimes (Vercel, Netlify Edge) because it maintains
  // persistent TCP connections that get killed between invocations.
  return new PrismaClient({
    datasourceUrl: connectionString,
  });
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
