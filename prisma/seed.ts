import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@apneadynamics.org";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  // Seed a default ContributionRateConfig if none exists
  const configCount = await prisma.contributionRateConfig.count();
  if (configCount === 0) {
    await prisma.contributionRateConfig.create({
      data: {
        name: "Handbook v1",
        philHealthRate: 2.5,
        pagIbigEmployeeFixed: 200,
        pagIbigEmployerFixed: 200,
        effectiveFrom: new Date("2024-01-01"),
      },
    });
    console.log("Created default ContributionRateConfig.");
  }

  console.log(`Admin user created: ${email} (password: ${password})`);
  console.log("IMPORTANT: Change the admin password after first login.");
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
