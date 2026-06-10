import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function normalizePostgresUrl(value: string | undefined): string | undefined {
  if (!value) return value;

  try {
    const url = new URL(value);
    if (url.protocol === "postgres:" || url.protocol === "postgresql:") {
      const schema = process.env.PAYROLL_DB_SCHEMA ?? "payroll";
      url.searchParams.set("schema", schema);
      url.searchParams.set("options", `-c search_path=${schema}`);
      if (url.searchParams.has("sslmode") && !url.searchParams.has("uselibpqcompat")) {
        url.searchParams.set("uselibpqcompat", "true");
      }
    }
    return url.toString();
  } catch {
    return value;
  }
}

const connectionString = normalizePostgresUrl(process.env.DATABASE_URL);

if (!connectionString) {
  throw new Error("DATABASE_URL is required for PostgreSQL runtime access.");
}

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool;
  globalForPrisma.prisma = prisma;
}
