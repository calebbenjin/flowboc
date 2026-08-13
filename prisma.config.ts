import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js auto-loads .env.local at runtime, but the Prisma CLI (migrate,
// studio, generate) runs as a standalone Node process and does not — load it
// explicitly here. This file only drives the CLI; the app's own PrismaClient
// instantiation in src/lib/db.ts sets its connection URL independently.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Direct (non-pooled) connection — migrations/introspection should
    // bypass Supabase's PgBouncer pooler.
    url: process.env["POSTGRES_URL_NON_POOLING"],
  },
});
