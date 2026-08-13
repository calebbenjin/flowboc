import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Supabase's pooled connection string sets `sslmode=require`, which recent
 * `pg` versions treat as strict `verify-full` and reject (self-signed cert
 * in Supabase's chain). `uselibpqcompat=true` restores the intended
 * encrypt-without-verifying behavior. See the pg-connection-string v3
 * migration notice for details.
 */
function withLibpqCompat(connectionString: string) {
  const url = new URL(connectionString);
  if (url.searchParams.get("sslmode") === "require") {
    url.searchParams.set("uselibpqcompat", "true");
  }
  return url.toString();
}

function createPrismaClient() {
  const connectionString = withLibpqCompat(process.env["POSTGRES_PRISMA_URL"]!);
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
