import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

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

const connectionString = normalizePostgresUrl(process.env.DIRECT_URL ?? process.env.DATABASE_URL);
if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required to seed the payroll database.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@apneadynamics.org";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`Admin user created: ${email} (password: ${password})`);
    console.log("IMPORTANT: Change the admin password after first login.");
  }

  // Seed a default ContributionRateConfig if none exists
  const configCount = await prisma.contributionRateConfig.count();
  if (configCount === 0) {
    await prisma.contributionRateConfig.create({
      data: {
        name: "Handbook v1",
        philHealthRate: 2.5,
        pagIbigEmployeeFixed: 100,
        pagIbigEmployerFixed: 100,
        effectiveFrom: new Date("2024-01-01"),
      },
    });
    console.log("Created default ContributionRateConfig.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
