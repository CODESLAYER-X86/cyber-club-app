import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  // Prefer the direct Supabase connection when available so runtime queries
  // do not fail if the pooler URL is missing or unhealthy.
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Database connection is not configured");
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    max: 2, // Restrict pool size in serverless/edge to prevent connection exhaustion
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;