import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  // Prefer the direct Supabase connection when available so runtime queries
  // do not fail if the pooler URL is missing or unhealthy.
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    // Log clearly instead of throwing silently — this is a deployment config issue
    console.error('[db] FATAL: Neither DIRECT_URL nor DATABASE_URL is set. All DB queries will fail.');
    throw new Error("Database connection is not configured. Set DIRECT_URL or DATABASE_URL environment variable.");
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    max: 5, // Allow enough connections for concurrent API requests
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // 5s timeout — Supabase cold starts can be slow
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;